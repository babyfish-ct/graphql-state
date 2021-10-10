import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { standardizedVariables } from "../state/impl/Variables";
import { EntityManager } from "./EntityManager";
import { ModificationContext } from "./ModificationContext";
import { Record } from "./Record";
import { RecordRef } from "./RecordRef";
import { RuntimeShape } from "./RuntimeShape";

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

    findRefById(id: any): RecordRef | undefined {
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
        let record = this.recordMap.get(id);
        if (record !== undefined) {
            record.undeleted();
            ctx.update(record);
        } else {
            record = new Record(this.type, id);
            this.recordMap.set(id, record);
            ctx.insert(record);
        }
        this.superManager?.saveId(ctx, id);
        return record;
    }

    save(ctx: ModificationContext, shape: RuntimeShape, obj: any) {
        if (typeof obj !== "object" || Array.isArray(obj)) {
            throw new Error("obj can only be plain object");
        }
        const idFieldName = this.type.idField.name;
        const id = obj[idFieldName];
        const fieldMap = this.type.fieldMap;
        for (const shapeField of shape.fields) { 
            if (shapeField.name !== idFieldName) {
                const field = fieldMap.get(shapeField.name);
                if (field === undefined) {
                    throw new Error(`Cannot set the non-existing field "${shapeField.name}" for type "${this.type.name}"`);
                }
                const manager = this.fieldManagerMap.get(shapeField.name) ?? this;
                const variables = standardizedVariables(shapeField.variables);
                const variablesCode = variables !== undefined ? JSON.stringify(variables) : undefined
                const value = obj[shapeField.alias ?? shapeField.name];
                manager.set(
                    ctx, 
                    id, 
                    field, 
                    variablesCode, 
                    variables, 
                    value
                );
                if (value !== undefined && shapeField.childShape !== undefined) {
                    const associationRecordManager = this.entityManager.recordManager(shapeField.childShape.typeName);
                    switch (field.category) {
                        case "REFERENCE":
                            associationRecordManager.save(ctx, shapeField.childShape, value);
                            break;
                        case "LIST":
                            if (Array.isArray(value)) {
                                for (const element of value) {
                                    associationRecordManager.save(ctx, shapeField.childShape!, element);
                                }
                            }
                            break;
                        case "CONNECTION":
                            const edges = value.edges;
                            if (Array.isArray(edges)) {
                                for (const edge of value) {
                                    associationRecordManager.save(ctx, shapeField.childShape!, edge.node);
                                }
                            }
                            break;
                    }
                }
            }
        }
    }

    private set(
        ctx: ModificationContext, 
        id: any, 
        field: FieldMetadata,
        variablesCode: string | undefined,
        variables: any, 
        value: any
    ) {
        const record = this.saveId(ctx, id);
        record.set(ctx, this.entityManager, field, variablesCode, variables, value);
    }
}

