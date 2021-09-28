import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { ModificationContext } from "./ModificationContext";
import { Record } from "./Record";
import { RecordManager } from "./RecordManager";
import { RecordRef } from "./RecordRef";

export class EntityManager {

    private recordManagerMap = new Map<string, RecordManager>();
    
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

    save(ctx: ModificationContext, typeName: string, obj: any) {
        return this.recordManager(typeName).save(ctx, obj);
    }
}