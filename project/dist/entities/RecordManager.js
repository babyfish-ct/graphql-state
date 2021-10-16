"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordManager = void 0;
const Record_1 = require("./Record");
class RecordManager {
    constructor(entityManager, type) {
        this.entityManager = entityManager;
        this.type = type;
        this.fieldManagerMap = new Map();
        this.recordMap = new Map();
    }
    initializeOtherManagers() {
        if (this.type.superType !== undefined) {
            this.superManager = this.entityManager.recordManager(this.type.superType.name);
        }
        for (const [fieldName, field] of this.type.fieldMap) {
            if (field.category !== "ID") {
                this.fieldManagerMap.set(fieldName, this.entityManager.recordManager(field.declaringType.name));
            }
        }
    }
    findRefById(id) {
        const record = this.recordMap.get(id);
        if (record === undefined) {
            return undefined;
        }
        return record.isDeleted ? {} : { value: record };
    }
    saveId(id) {
        var _a;
        const ctx = this.entityManager.modificationContext;
        let record = this.recordMap.get(id);
        if (record !== undefined) {
            ctx.update(record);
            record.undelete();
        }
        else {
            record = new Record_1.Record(this.type, id);
            this.recordMap.set(id, record);
            ctx.insert(record);
        }
        (_a = this.superManager) === null || _a === void 0 ? void 0 : _a.saveId(id);
        return record;
    }
    save(shape, obj) {
        var _a, _b;
        if (typeof obj !== "object" || Array.isArray(obj)) {
            throw new Error("obj can only be plain object");
        }
        let idFieldName;
        let id;
        if (shape.typeName === 'Query') {
            idFieldName = undefined;
            id = Record_1.QUERY_OBJECT_ID;
        }
        else {
            idFieldName = this.type.idField.name;
            id = obj[idFieldName];
        }
        const fieldMap = this.type.fieldMap;
        for (const [, shapeField] of shape.fieldMap) {
            if (shapeField.name !== idFieldName) {
                const field = fieldMap.get(shapeField.name);
                if (field === undefined) {
                    throw new Error(`Cannot set the non-existing field "${shapeField.name}" for type "${this.type.name}"`);
                }
                const manager = (_a = this.fieldManagerMap.get(shapeField.name)) !== null && _a !== void 0 ? _a : this;
                const value = obj[(_b = shapeField.alias) !== null && _b !== void 0 ? _b : shapeField.name];
                manager.set(id, field, shapeField.args, value);
                if (value !== undefined && shapeField.childShape !== undefined) {
                    const associationRecordManager = this.entityManager.recordManager(shapeField.childShape.typeName);
                    switch (field.category) {
                        case "REFERENCE":
                            associationRecordManager.save(shapeField.childShape, value);
                            break;
                        case "LIST":
                            if (Array.isArray(value)) {
                                for (const element of value) {
                                    associationRecordManager.save(shapeField.childShape, element);
                                }
                            }
                            break;
                        case "CONNECTION":
                            const edges = value.edges;
                            if (Array.isArray(edges)) {
                                for (const edge of value) {
                                    associationRecordManager.save(shapeField.childShape, edge.node);
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
    set(id, field, args, value) {
        const record = this.saveId(id);
        record.set(this.entityManager, field, args, value);
    }
}
exports.RecordManager = RecordManager;
