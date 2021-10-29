"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordManager = void 0;
const Record_1 = require("./Record");
class RecordManager {
    constructor(entityManager, type) {
        this.entityManager = entityManager;
        this.type = type;
        this.recordMap = new Map();
    }
    initializeOtherManagers() {
        if (this.type.superType !== undefined) {
            this.superManager = this.entityManager.recordManager(this.type.superType.name);
        }
    }
    findRefById(id) {
        const record = this.recordMap.get(id);
        if (record === undefined) {
            return undefined;
        }
        return record.isDeleted ? {} : { value: record };
    }
    saveId(id, runtimeType) {
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
    insertId(id, runtimeType) {
        var _a;
        const record = new Record_1.Record(this.type, runtimeType, id);
        this.recordMap.set(id, record);
        (_a = this.superManager) === null || _a === void 0 ? void 0 : _a.insertId(id, runtimeType);
        return record;
    }
    visit(shape, obj, runtimeTypeOrName, visitor) {
        var _a, _b;
        const runtimeType = typeof runtimeTypeOrName === "string" ? (this.type.name === runtimeTypeOrName ?
            this.type :
            this.entityManager.schema.typeMap.get(runtimeTypeOrName)) :
            runtimeTypeOrName;
        if (runtimeType === undefined) {
            throw new Error(`Cannot visit obj with illegal type "${runtimeTypeOrName}""`);
        }
        if (!this.type.isAssignableFrom(runtimeType)) {
            throw new Error(`Cannot visit obj with illegal type "${runtimeType.name}" because that type is not derived type of "${this.type.name}"`);
        }
        if (typeof obj !== "object" || Array.isArray(obj)) {
            throw new Error("Cannot visit data that is not plain object");
        }
        let idFieldName;
        let id;
        if (shape.typeName === 'Query') {
            idFieldName = undefined;
            id = Record_1.QUERY_OBJECT_ID;
        }
        else {
            idFieldName = this.type.idField.name;
            const idShapeField = shape.fieldMap.get(idFieldName);
            if (idShapeField === undefined) {
                throw new Error(`Cannot visit the object whose type is "${shape.typeName}" without id`);
            }
            id = obj[(_a = idShapeField.alias) !== null && _a !== void 0 ? _a : idShapeField.name];
            if (id === undefined || id === null) {
                throw new Error(`Cannot visit the object whose type is "${shape.typeName}" without id`);
            }
        }
        for (const [, shapeField] of shape.fieldMap) {
            if (shapeField.name !== idFieldName) {
                const field = runtimeType.fieldMap.get(shapeField.name);
                if (field === undefined) {
                    throw new Error(`Cannot visit the non-existing field "${shapeField.name}" for type "${this.type.name}"`);
                }
                let value = obj[(_b = shapeField.alias) !== null && _b !== void 0 ? _b : shapeField.name];
                if (value === null) {
                    value = undefined;
                }
                if (visitor(id, runtimeType, field, shapeField.args, value) === false) {
                    return;
                }
                if (value !== undefined && field.isAssociation && shapeField.childShape !== undefined) {
                    switch (field.category) {
                        case "REFERENCE":
                            this
                                .entityManager
                                .visit(shapeField.childShape, value, visitor);
                            break;
                        case "LIST":
                            if (Array.isArray(value)) {
                                for (const element of value) {
                                    this.entityManager.visit(shapeField.childShape, element, visitor);
                                }
                            }
                            break;
                        case "CONNECTION":
                            const edges = value.edges;
                            if (Array.isArray(edges)) {
                                for (const edge of edges) {
                                    this.entityManager.visit(shapeField.nodeShape, edge.node, visitor);
                                }
                            }
                            break;
                    }
                }
            }
        }
    }
    delete(id) {
        var _a;
        let record = this.recordMap.get(id);
        if (record !== undefined) {
            this.entityManager.modificationContext.delete(record);
            record.delete(this.entityManager);
        }
        else {
            record = new Record_1.Record(this.type, id, true);
            this.recordMap.set(id, record);
        }
        (_a = this.superManager) === null || _a === void 0 ? void 0 : _a.delete(id);
    }
    evict(id) {
        let record = this.recordMap.get(id);
        if (record !== undefined) {
            this.entityManager.modificationContext.evict(record);
            this.recordMap.delete(id);
            record.dispose(this.entityManager);
        }
    }
    forEach(visitor) {
        for (const [, record] of this.recordMap) {
            if (visitor(record) === false) {
                break;
            }
        }
    }
    set(id, runtimeType, field, args, value) {
        const record = this.saveId(id, runtimeType);
        record.set(this.entityManager, field, args, value);
    }
    markGarableFlag() {
        for (const record of this.recordMap.values()) {
            record.markGarbageFlag();
        }
    }
}
exports.RecordManager = RecordManager;
