import { EntityChangeEvent } from "..";
import { AbstractDataService } from "../data/AbstractDataService";
import { BatchDataService } from "../data/BatchDataService";
import { RemoteDataService } from "../data/RemoteDataService";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { StateManagerImpl } from "../state/impl/StateManagerImpl";
import { ModificationContext } from "./ModificationContext";
import { QueryArgs } from "./QueryArgs";
import { QueryResult } from "./QueryResult";
import { QUERY_OBJECT_ID, Record } from "./Record";
import { RecordManager } from "./RecordManager";
import { RecordRef } from "./RecordRef";
import { RuntimeShape } from "./RuntimeShape";

export class EntityManager {

    readonly dataService: AbstractDataService;

    private _recordManagerMap = new Map<string, RecordManager>();

    private _queryResultMap = new Map<string, QueryResult>();

    private _listenerMap = new Map<string | undefined, Set<(e: EntityChangeEvent) => any>>();

    private _ctx?: ModificationContext;

    private _queryRecord?: Record;
    
    constructor(
        readonly stateManager: StateManagerImpl<any>,
        readonly schema: SchemaMetadata
    ) {
        this.dataService = new BatchDataService(new RemoteDataService(this));
        const queryType = schema.typeMap.get("Query");
        if (queryType !== undefined) {
            this._queryRecord = this.saveId("Query", QUERY_OBJECT_ID);
        }
    }

    recordManager(typeName: string): RecordManager {
        const type = this.schema.typeMap.get(typeName); 
        if (type === undefined) {
            throw new Error(`Illegal type "${typeName}" that is not exists in schema`);
        }
        let recordManager = this._recordManagerMap.get(typeName);
        if (recordManager === undefined) {
            recordManager = new RecordManager(this, type);
            this._recordManagerMap.set(typeName, recordManager);
            recordManager.initializeOtherManagers();
        }
        return recordManager;
    }

    findRefById(typeName: string, id: any): RecordRef | undefined {
        return this.recordManager(typeName).findRefById(id);
    }

    get modificationContext(): ModificationContext {
        const ctx = this._ctx;
        if (ctx === undefined) {
            throw new Error(`No modificaton context`);
        }
        return ctx;
    }

    modify<T>(action: () => T): T {
        if (this._ctx !== undefined) {
            return action();
        } else {
            this._ctx = new ModificationContext(
                this.linkToQuery.bind(this),
                this.publishEntityChangeEvent.bind(this)
            );
            try {
                return action();
            } finally {
                try {
                    this._ctx.close();
                } finally {
                    this._ctx = undefined;
                }
            }
        }
    }

    save(
        shape: RuntimeShape,
        objOrArray: object | readonly object[]
    ): void {
        this.modify(() => {
            const recordManager = this.recordManager(shape.typeName);
            if (Array.isArray(objOrArray)) {
                for (const obj of objOrArray) {
                    recordManager.save(shape, obj);
                }
            } else if (objOrArray !== undefined && objOrArray !== null) {
                recordManager.save(shape, objOrArray);
            }
        });
    }

    delete(
        typeName: string, 
        idOrArray: any
    ) {
        if (typeName === 'Query') {
            throw new Error(`The typeof deleted object cannot be the special type 'Query'`);
        }
        this.modify(() => {
            const recordManager = this.recordManager(typeName);
            if (Array.isArray(idOrArray)) {
                for (const id of idOrArray) {
                    recordManager.delete(id);
                }
            } else {
                recordManager.delete(idOrArray);
            }
        });
    }

    saveId(typeName: string, id: any): Record {
        return this.modify(() => {
            return this.recordManager(typeName).saveId(id);
        });
    }

    retain(args: QueryArgs): QueryResult {
        
        let result = this._queryResultMap.get(args.key);
        if (result === undefined) {
            result = new QueryResult(this, args);
            this._queryResultMap.set(args.key, result);
        }
        return result.retain();
    }

    release(args: QueryArgs) {
        const result = this._queryResultMap.get(args.key);
        if (result?.release() === true) {
            this._queryResultMap.delete(args.key);
        }
    }

    addListener(typeName: string | undefined, listener: (e: EntityChangeEvent) => void): void {
        if (listener !== undefined && listener !== null) {
            let set = this._listenerMap.get(typeName);
            if (set === undefined) {
                set = new Set<(e: EntityChangeEvent) => void>();
                this._listenerMap.set(typeName, set);
            } 
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }

    removeListener(typeName: string | undefined, listener: (e: EntityChangeEvent) => void): void {
        this._listenerMap.get(typeName)?.delete(listener);
    }

    private linkToQuery(type: TypeMetadata, id: any) {
        const qr = this._queryRecord;
        if (qr !== undefined) {
            const record = this.saveId(type.name, id);
            for (const [, field] of qr.type.fieldMap) {
                if (field.targetType !== undefined && field.targetType.isAssignableFrom(type)) {
                    qr.link(this, field, record);
                }
            }
        }
    }

    private publishEntityChangeEvent(e: EntityChangeEvent) {
        for (const [, set] of this._listenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }
}
