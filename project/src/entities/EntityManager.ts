import { Fetcher } from "graphql-ts-client-api";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { BatchEntityRequest } from "./BatchEntityRequest";
import { ModificationContext } from "./ModificationContext";
import { Record } from "./Record";
import { RecordManager } from "./RecordManager";
import { RecordRef } from "./RecordRef";
import { RuntimeShape, toRuntimeShape } from "./RuntimeShape";

export class EntityManager {

    private recordManagerMap = new Map<string, RecordManager>();

    readonly batchEntityRequest: BatchEntityRequest = new BatchEntityRequest(this);
    
    constructor(readonly schema: SchemaMetadata) {}

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

    findById(typeName: string, id: any): RecordRef | undefined {
        return this.recordManager(typeName).findById(id);
    }

    saveId(ctx: ModificationContext, typeName: string, id: any): Record {
        return this.recordManager(typeName).saveId(ctx, id);
    }

    save<T extends object, TVariable extends object>(
        ctx: ModificationContext, 
        fetcher: Fetcher<string, T, TVariable>,
        obj: T,
        variables?: TVariable
    ) {
        const shape = toRuntimeShape(fetcher, variables);
        return this.recordManager(fetcher.fetchableType.name).save(ctx, shape, obj);
    }

    loadByIds(ids: any[], shape: RuntimeShape): Promise<any[]> {
        console.log(ids, JSON.stringify(shape));
        throw new Error("bathcLoad is not implemented");
    }
}