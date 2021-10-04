import { Fetcher } from "graphql-ts-client-api";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { BatchEntityRequest } from "./BatchEntityRequest";
import { ModificationContext } from "./ModificationContext";
import { Record } from "./Record";
import { RecordManager } from "./RecordManager";
import { RecordRef } from "./RecordRef";
import { RuntimeShape } from "./RuntimeShape";
export declare class EntityManager {
    readonly schema: SchemaMetadata;
    private recordManagerMap;
    readonly batchEntityRequest: BatchEntityRequest;
    constructor(schema: SchemaMetadata);
    recordManager(typeName: string): RecordManager;
    findById(typeName: string, id: any): RecordRef | undefined;
    saveId(ctx: ModificationContext, typeName: string, id: any): Record;
    save<T extends object, TVariable extends object>(ctx: ModificationContext, fetcher: Fetcher<string, T, TVariable>, obj: T, variables?: TVariable): void;
    loadByIds(ids: any[], shape: RuntimeShape): Promise<any[]>;
}
