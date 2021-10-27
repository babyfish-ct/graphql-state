import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { VariableArgs } from "../state/impl/Args";
import { EntityManager } from "./EntityManager";
import { QUERY_OBJECT_ID, Record } from "./Record";
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

    saveId(id: any, runtimeType: TypeMetadata): Record {
        let record = this.recordMap.get(id);
        if (record !== undefined) {
            if (record.runtimeType === runtimeType) {
                if (record.undelete()) {
                    this.entityManager.modificationContext.insert(record);  
                }
                return record;
            }
            this.entityManager.delete(record.runtimeType.name, record.id);
        }
        record = this.insertId(id, runtimeType);
        this.entityManager.modificationContext.insert(record);
        return record;
    }

    private insertId(id: any, runtimeType: TypeMetadata): Record {
        const record = new Record(this.type, runtimeType, id);
        this.recordMap.set(id, record);
        this.superManager?.insertId(id, runtimeType);
        return record;
    }

    save(shape: RuntimeShape, obj: any, runtimeTypeOrName: TypeMetadata | string) {
        const runtimeType = 
            typeof runtimeTypeOrName === "string" ? (
                this.type.name === runtimeTypeOrName ? 
                this.type : 
                this.entityManager.schema.typeMap.get(runtimeTypeOrName)
            ) :
            runtimeTypeOrName;
        if (runtimeType === undefined) {
            throw new Error(`Cannot save obj with illegal type "${runtimeTypeOrName}""`);
        }
        if (!this.type.isAssignableFrom(runtimeType)) {
            throw new Error(`Cannot save obj with illegal type "${runtimeType.name}" because that type is not derived type of "${this.type.name}"`);
        }
        if (typeof obj !== "object" || Array.isArray(obj)) {
            throw new Error("obj can only be plain object");
        }
        let idFieldName: string | undefined;
        let id: any;
        if (shape.typeName === 'Query') {
            idFieldName = undefined;
            id = QUERY_OBJECT_ID;
        } else {
            idFieldName = this.type.idField.name;
            const idShapeField = shape.fieldMap.get(idFieldName);
            if (idShapeField === undefined) {
                throw new Error(`Cannot save the object whose type is "${shape.typeName}" without id`);
            }
            id = obj[idShapeField.alias ?? idShapeField.name];
            if (id === undefined || id === null) {
                throw new Error(`Cannot save the object whose type is "${shape.typeName}" without id`);
            }
        }
        for (const [, shapeField] of shape.fieldMap) { 
            if (shapeField.name !== idFieldName) {
                const field = runtimeType.fieldMap.get(shapeField.name);
                if (field === undefined) {
                    throw new Error(`Cannot set the non-existing field "${shapeField.name}" for type "${this.type.name}"`);
                }
                const manager = this.fieldManagerMap.get(shapeField.name) ?? this;
                let value = obj[shapeField.alias ?? shapeField.name];
                if (value === null) {
                    value = undefined;
                }
                manager.set(
                    id, 
                    runtimeType,
                    field, 
                    shapeField.args,
                    value
                );
                if (value !== undefined && field.isAssociation && shapeField.childShape !== undefined) {
                    switch (field.category) {
                        case "REFERENCE":
                            this
                            .entityManager
                            .save(shapeField.childShape, value);
                            break;
                        case "LIST":
                            if (Array.isArray(value)) {
                                for (const element of value) {
                                    this.entityManager.save(shapeField.childShape, element);
                                }
                            }
                            break;
                        case "CONNECTION":
                            const edges = value.edges;
                            if (Array.isArray(edges)) {
                                for (const edge of edges) {
                                    this.entityManager.save(shapeField.nodeShape!, edge.node);
                                }
                            }
                            break;
                    }
                }
            }
        }
    }

    delete(id: any) {
        let record = this.recordMap.get(id);
        if (record !== undefined) {
            this.entityManager.modificationContext.delete(record);
            record.delete(this.entityManager);
        } else {
            record = new Record(this.type, id, true);
            this.recordMap.set(id, record);
        }
        this.superManager?.delete(id);
    }

    evict(id: any) {
        let record = this.recordMap.get(id);
        if (record !== undefined) {
            this.entityManager.modificationContext.evict(record);
            this.recordMap.delete(id);
            record.dispose(this.entityManager);
        }
    }

    forEach(visitor: (record: Record) => boolean | void) {
        for (const [, record] of this.recordMap) {
            if (visitor(record) === false) {
                break;
            }
        }
    }

    private set(
        id: any, 
        runtimeType: TypeMetadata,
        field: FieldMetadata,
        args: VariableArgs | undefined, 
        value: any
    ) {
        const record = this.saveId(id, runtimeType);
        record.set(this.entityManager, field, args, value);
    }
}

