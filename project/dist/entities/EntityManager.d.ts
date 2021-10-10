import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { StateManagerImpl } from "../state/impl/StateManagerImpl";
import { BatchEntityRequest } from "./BatchEntityRequest";
import { ModificationContext } from "./ModificationContext";
import { QueryArgs, QueryResult } from "./QueryResult";
import { Record } from "./Record";
import { RecordManager } from "./RecordManager";
import { RecordRef } from "./RecordRef";
import { RuntimeShape } from "./RuntimeShape";
export declare class EntityManager {
    readonly stateManager: StateManagerImpl<any>;
    readonly schema: SchemaMetadata;
    private recordManagerMap;
    private queryResultMap;
    readonly batchEntityRequest: BatchEntityRequest;
    constructor(stateManager: StateManagerImpl<any>, schema: SchemaMetadata);
    recordManager(typeName: string): RecordManager;
    findRefById(typeName: string, id: any): RecordRef | undefined;
    saveId(ctx: ModificationContext, typeName: string, id: any): Record;
    save<T extends object, TVariable extends object>(ctx: ModificationContext, shape: RuntimeShape, obj: T): void;
    loadByIds(ids: any[], shape: RuntimeShape): Promise<any[]>;
    retain(queryArgs: QueryArgs): QueryResult;
    release(queryArgs: QueryArgs): void;
    private queryKeyOf;
}
