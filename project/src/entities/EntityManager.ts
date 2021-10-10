import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
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

    saveId(ctx: ModificationContext, typeName: string, id: any): Record {
        return this.recordManager(typeName).saveId(ctx, id);
    }

    save<T extends object, TVariable extends object>(
        ctx: ModificationContext, 
        shape: RuntimeShape,
        obj: T
    ) {
        return this.recordManager(shape.typeName).save(ctx, shape, obj);
    }

    loadByIds(ids: any[], shape: RuntimeShape): Promise<any[]> {
        console.log(ids, JSON.stringify(shape));
        throw new Error("bathcLoad is not implemented");
    }

    retain(queryArgs: QueryArgs): QueryResult {
        
        const key = this.queryKeyOf(queryArgs.shape, queryArgs.id);
        let result = this.queryResultMap.get(key);
        if (result === undefined) {
            result = new QueryResult(this, queryArgs);
        }
        return result.retain();
    }

    release(queryArgs: QueryArgs) {
        const key = this.queryKeyOf(queryArgs.shape, queryArgs.id);
        const result = this.queryResultMap.get(key);
        if (result?.release() === true) {
            this.queryResultMap.delete(key);
        }
    }

    private queryKeyOf(shape: RuntimeShape, id?:any): string {
        return id === undefined ? shape.toString() : `${shape.toString}(${id})`;
    }
}
