import { EntityChangeEvent } from "..";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { StateManagerImpl } from "../state/impl/StateManagerImpl";
import { BatchEntityRequest } from "./BatchEntityRequest";
import { ModificationContext } from "./ModificationContext";
import { QueryArgs, QueryResult } from "./QueryResult";
import { Record } from "./Record";
import { RecordManager } from "./RecordManager";
import { RecordRef } from "./RecordRef";
import { RuntimeShape } from "./RuntimeShape";

export class EntityManager {

    private recordManagerMap = new Map<string, RecordManager>();

    private queryResultMap = new Map<string, QueryResult>();

    readonly batchEntityRequest: BatchEntityRequest = new BatchEntityRequest(this);

    private _entityChangeListenerMap = new Map<string | undefined, Set<(e: EntityChangeEvent) => any>>();

    private _ctx?: ModificationContext;
    
    constructor(
        readonly stateManager: StateManagerImpl<any>,
        readonly schema: SchemaMetadata
    ) {}

    recordManager(typeName: string): RecordManager {
        const type = this.schema.typeMap.get(typeName); 
        if (type === undefined) {
            throw new Error(`Illegal type "${typeName}" that is not exists in schema`);
        }
        let recordManager = this.recordManagerMap.get(typeName);
        if (recordManager === undefined) {
            recordManager = new RecordManager(this, type);
            this.recordManagerMap.set(typeName, recordManager);
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
                const ctx = this._ctx;
                this._ctx = undefined;
                ctx.close();
            }
        }
    }

    save(
        shape: RuntimeShape,
        objOrArray: object | readonly object[]
    ): void {
        if (shape.typeName === 'Query') {
            throw new Error(`The typeof saved object cannot be the special type 'Query'`);
        }
        const recordManager = this.recordManager(shape.typeName);
        if (Array.isArray(objOrArray)) {
            for (const obj of objOrArray) {
                recordManager.save(shape, obj);
            }
        } else if (objOrArray !== undefined && objOrArray !== null) {
            recordManager.save(shape, objOrArray);
        }
    }

    delete(
        typeName: string, 
        idOrArray: any
    ) {
        if (typeName === 'Query') {
            throw new Error(`The typeof deleted object cannot be the special type 'Query'`);
        }
        const ctx = new ModificationContext(
            this.linkToQuery.bind(this), 
            this.publishEntityChangeEvent.bind(this)
        );
        if (Array.isArray(idOrArray)) {
            for (const id of idOrArray) {
                this.recordManager(typeName).delete(id);
            }
        } else {
            this.recordManager(typeName).delete(idOrArray);
        }
        ctx.close();
    }

    saveId(typeName: string, id: any): Record {
        if (typeName === 'Query') {
            throw new Error(`typeName cannot be 'Query'`);
        }
        return this.recordManager(typeName).saveId(id);
    }

    loadByIds(ids: any[], shape: RuntimeShape): Promise<any[]> {
        if (shape.typeName === 'Query') {
            throw new Error(`typeName cannot be 'Query'`);
        }
        throw new Error("bathcLoad is not implemented");
    }

    retain(queryArgs: QueryArgs): QueryResult {
        
        const key = this.queryKeyOf(queryArgs.shape, queryArgs.ids);
        let result = this.queryResultMap.get(key);
        if (result === undefined) {
            result = new QueryResult(this, queryArgs);
            this.queryResultMap.set(key, result);
        }
        return result.retain();
    }

    release(queryArgs: QueryArgs) {
        const key = this.queryKeyOf(queryArgs.shape, queryArgs.ids);
        const result = this.queryResultMap.get(key);
        if (result?.release() === true) {
            this.queryResultMap.delete(key);
        }
    }

    addListener(typeName: string | undefined, listener: (e: EntityChangeEvent) => void): void {
        if (listener !== undefined && listener !== null) {
            let set = this._entityChangeListenerMap.get(typeName);
            if (set === undefined) {
                set = new Set<(e: EntityChangeEvent) => void>();
                this._entityChangeListenerMap.set(typeName, set);
            } 
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }

    removeListener(typeName: string | undefined, listener: (e: EntityChangeEvent) => void): void {
        this._entityChangeListenerMap.get(typeName)?.delete(listener);
    }

    private linkToQuery(type: TypeMetadata, id: any) {

    }

    private publishEntityChangeEvent(e: EntityChangeEvent) {
        for (const [, set] of this._entityChangeListenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }

    private queryKeyOf(shape: RuntimeShape, ids?: ReadonlyArray<any>): string {
        return ids === undefined ? shape.toString() : `${shape.toString()}${JSON.stringify(ids)}`;
    }
}
