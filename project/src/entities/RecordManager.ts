import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { EntityManager } from "./EntityManager";
import { ModificationContext } from "./ModificationContext";
import { Record } from "./Record";
import { RecordRef } from "./RecordRef";

export class RecordManager {

    private superManager?: RecordManager;

    private fieldManagerMap = new Map<string, RecordManager>();

    private recordMap = new Map<any, Record>();

    constructor(
        readonly entityManager: EntityManager,
        readonly type: TypeMetadata
    ) {}

    initializeOtherManagers() {
        if (this.type.superType !== undefined) {
            this.superManager = this.entityManager.recordManager(this.type.superType.name);
        }
        for (const [fieldName, field] of this.type.fieldMap) {
            if (field.category !== "ID") {
                this.fieldManagerMap.set(
                    fieldName,
                    this.entityManager.recordManager(field.declaringType.name)
                );
            }
        }
    }

    findById(id: any): RecordRef | undefined {
        const record = this.recordMap.get(id);
        if (record === undefined) {
            return undefined;
        }
        return record.isDeleted ? {} : { value: record };
    }

    saveId(ctx: ModificationContext, id: any): Record {
        if (typeof id !== "number" && typeof id !== "string") {
            throw new Error(`Illegal id '${id}', id can only be number or string`);
        }
        let record = this.recordMap.get(id)?.undeleted();
        if (record === undefined) {
            record = new Record(id);
            this.recordMap.set(id, record);
        }
        this.superManager?.saveId(ctx, id);
        return record;
    }

    save(ctx: ModificationContext, obj: any) {
        if (typeof obj !== "object" || Array.isArray(obj)) {
            throw new Error("obj can only be plain object");
        }
        const idFieldName = this.type.idField.name;
        const id = obj[idFieldName];
        const fieldMap = this.type.fieldMap;
        for (const fieldName in obj) { 
            if (fieldName !== idFieldName) {
                const manager = this.fieldManagerMap.get(fieldName) ?? this;
                manager.set(ctx, id, fieldName, fieldMap.get(fieldName), undefined, undefined, obj[fieldName]);
            }
        }
    }

    private set(
        ctx: ModificationContext, 
        id: any, 
        fieldName: string, 
        field: FieldMetadata | undefined,
        variablesCode: string | undefined,
        variables: any, 
        value: any
    ) {
        const record = this.saveId(ctx, id);
        record.set(ctx, this.entityManager, fieldName, field, variablesCode, variables, value);
    }
}

