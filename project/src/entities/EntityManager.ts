import { EntityChangeEvent } from "..";
import { AbstractDataService } from "../data/AbstractDataService";
import { MergedDataService } from "../data/MergedDataService";
import { RemoteDataService } from "../data/RemoteDataService";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { StateManagerImpl } from "../state/impl/StateManagerImpl";
import { AssociationValue } from "./assocaition/AssocaitionValue";
import { EntityEvictEvent } from "./EntityEvent";
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

    private _evictListenerMap = new Map<string | undefined, Set<(e: EntityEvictEvent) => any>>();

    private _changeListenerMap = new Map<string | undefined, Set<(e: EntityChangeEvent) => any>>();

    private _ctx?: ModificationContext;

    private _queryRecord?: Record;

    private _associationValueObservers = new Set<AssociationValue>();

    private _bidirectionalAssociationManagementSuspending = false;
    
    constructor(
        readonly stateManager: StateManagerImpl<any>,
        readonly schema: SchemaMetadata
    ) {
        this.dataService = new MergedDataService(new RemoteDataService(this));
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
                this.publishEvictChangeEvent.bind(this),
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
            if (Array.isArray(objOrArray)) {
                for (const obj of objOrArray) {
                    const typeName = obj["__typename"] ?? shape.typeName;
                    this.recordManager(typeName).save(shape, obj, typeName);
                }
            } else if (objOrArray !== undefined && objOrArray !== null) {
                const typeName = objOrArray["__typename"] ?? shape.typeName;
                this.recordManager(typeName).save(shape, objOrArray, typeName);
            }
        });
    }

    delete(
        typeName: string, 
        idOrArray: any
    ): void {
        if (typeName === 'Query') {
            throw new Error(`The typeof deleted object cannot be the special type 'Query'`);
        }
        this.modify(() => {
            const recordManager = this.recordManager(typeName);
            if (Array.isArray(idOrArray)) {
                for (const id of idOrArray) {
                    if (id !== undefined && id !== null) {
                        recordManager.delete(id);
                    }
                }
            } else if (idOrArray !== undefined && idOrArray !== null) {
                recordManager.delete(idOrArray);
            }
        });
    }

    evict(
        typeName: string,
        idOrArray: any
    ): void {
        this.modify(() => {
            if (typeName === "Query") {
                this.recordManager("Query").evict(QUERY_OBJECT_ID);
            } else {
                const recordManager = this.recordManager(typeName);
                if (Array.isArray(idOrArray)) {
                    for (const id of idOrArray) {
                        if (id !== undefined && id !== null) {
                            recordManager.delete(id);
                        }
                    }
                } else if (idOrArray !== undefined && idOrArray !== null) {
                    recordManager.evict(idOrArray);
                }
            }
        });
    }

    saveId(typeName: string, id: any): Record {
        return this.modify(() => {
            const type = this.schema.typeMap.get(typeName);
            if (type === undefined) {
                throw new Error(`Cannot save object id for illegal type "${typeName}"`);
            }
            return this.recordManager(typeName).saveId(id, type);
        });
    }

    retain(args: QueryArgs): QueryResult {
        
        let result = this._queryResultMap.get(args.key);
        if (result === undefined) {
            if (!this.schema.isAcceptable(args.fetcher.fetchableType)) {
                throw new Error("Cannot accept that fetcher because it is not configured in the state manager");
            }
            result = new QueryResult(this, args, () => this._queryResultMap.delete(args.key));
            this._queryResultMap.set(args.key, result);
        }
        return result.retain();
    }

    release(args: QueryArgs) {
        const result = this._queryResultMap.get(args.key);
        result?.release(5000);
    }

    addEvictListener(typeName: string | undefined, listener: (e: EntityEvictEvent) => void): void {
        if (listener !== undefined && listener !== null) {
            let set = this._evictListenerMap.get(typeName);
            if (set === undefined) {
                set = new Set<(e: EntityEvictEvent) => void>();
                this._evictListenerMap.set(typeName, set);
            } 
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }

    removeEvictListener(typeName: string | undefined, listener: (e: EntityEvictEvent) => void): void {
        this._evictListenerMap.get(typeName)?.delete(listener);
    }

    private publishEvictChangeEvent(e: EntityEvictEvent) {
        for (const observer of this._associationValueObservers) {
            observer.onEntityEvict(this, e);
        }
        for (const [, set] of this._evictListenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }

    addChangeListener(typeName: string | undefined, listener: (e: EntityChangeEvent) => void): void {
        if (listener !== undefined && listener !== null) {
            let set = this._changeListenerMap.get(typeName);
            if (set === undefined) {
                set = new Set<(e: EntityChangeEvent) => void>();
                this._changeListenerMap.set(typeName, set);
            } 
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }

    removeChangeListener(typeName: string | undefined, listener: (e: EntityChangeEvent) => void): void {
        this._changeListenerMap.get(typeName)?.delete(listener);
    }

    private publishEntityChangeEvent(e: EntityChangeEvent) {
        for (const observer of this._associationValueObservers) {
            observer.onEntityChange(this, e);
        }
        for (const [, set] of this._changeListenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }

    private linkToQuery(type: TypeMetadata, id: any) {
        const qr = this._queryRecord;
        if (qr !== undefined) {
            const record = this.saveId(type.name, id);
            for (const [, field] of qr.staticType.fieldMap) {
                if (field.targetType !== undefined && field.targetType.isAssignableFrom(type)) {
                    qr.link(this, field, record);
                }
            }
        }
    }

    addAssociationValueObserver(observer: AssociationValue) {
        if (observer !== undefined && observer !== null) {
            this._associationValueObservers.add(observer);
        }
    }

    removeAssociationValueObserver(observer: AssociationValue) {
        this._associationValueObservers.delete(observer);
    }

    forEach(typeName: string, visitor: (record: Record) => boolean | void) {
        this.recordManager(typeName).forEach(visitor);
    }

    get isBidirectionalAssociationManagementSuspending(): boolean {
        return this._bidirectionalAssociationManagementSuspending;
    }

    suspendBidirectionalAssociationManagement<T>(action: () => T): T {
        if (this._bidirectionalAssociationManagementSuspending) {
            return action();
        }
        this._bidirectionalAssociationManagementSuspending = true;
        try {
            return action();
        } finally {
            this._bidirectionalAssociationManagementSuspending = false;
        }
    }
}
