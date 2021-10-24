import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { EntityManager } from "./EntityManager";
import { QUERY_OBJECT_ID, Record } from "./Record";
import { RecordRef } from "./RecordRef";
import { RuntimeShape } from "./RuntimeShape";
import { VariableArgs } from "./VariableArgs";

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

    saveId(id: any): Record {
        const ctx = this.entityManager.modificationContext;
        let record = this.recordMap.get(id);
        if (record !== undefined) {
            record.undelete();
        } else {
            record = new Record(this.type, id);
            this.recordMap.set(id, record);
            ctx.insert(record);
        }
        this.superManager?.saveId(id);
        return record;
    }

    save(shape: RuntimeShape, obj: any) {
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
        }
        const fieldMap = this.type.fieldMap;
        for (const [, shapeField] of shape.fieldMap) { 
            if (shapeField.name !== idFieldName) {
                const field = fieldMap.get(shapeField.name);
                if (field === undefined) {
                    throw new Error(`Cannot set the non-existing field "${shapeField.name}" for type "${this.type.name}"`);
                }
                const manager = this.fieldManagerMap.get(shapeField.name) ?? this;
                const value = obj[shapeField.alias ?? shapeField.name];
                manager.set(
                    id, 
                    field, 
                    shapeField.args,
                    value
                );
                if (value !== undefined && shapeField.childShape !== undefined) {
                    switch (field.category) {
                        case "REFERENCE":
                            this
                            .entityManager
                            .recordManager(shapeField.childShape.typeName)
                            .save(shapeField.childShape, value);
                            break;
                        case "LIST":
                            if (Array.isArray(value)) {
                                const associationRecordManager = this.entityManager.recordManager(shapeField.childShape.typeName);
                                for (const element of value) {
                                    associationRecordManager.save(shapeField.childShape, element);
                                }
                            }
                            break;
                        case "CONNECTION":
                            const edges = value.edges;
                            if (Array.isArray(edges)) {
                                const nodeShape = shapeField.nodeShape!;
                                const associationRecordManager = this.entityManager.recordManager(nodeShape.typeName);
                                for (const edge of edges) {
                                    associationRecordManager.save(nodeShape, edge.node);
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
        field: FieldMetadata,
        args: VariableArgs | undefined, 
        value: any
    ) {
        const record = this.saveId(id);
        record.set(this.entityManager, field, args, value);
    }
}

