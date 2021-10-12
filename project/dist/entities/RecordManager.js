"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordManager = void 0;
const Variables_1 = require("../state/impl/Variables");
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
    saveId(ctx, id) {
        var _a;
        if (typeof id !== "number" && typeof id !== "string") {
            throw new Error(`Illegal id '${id}', id can only be number or string`);
        }
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
        (_a = this.superManager) === null || _a === void 0 ? void 0 : _a.saveId(ctx, id);
        return record;
    }
    save(ctx, shape, obj) {
        var _a, _b;
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
                const manager = (_a = this.fieldManagerMap.get(shapeField.name)) !== null && _a !== void 0 ? _a : this;
                const variables = Variables_1.standardizedVariables(shapeField.variables);
                const variablesCode = variables !== undefined ? JSON.stringify(variables) : undefined;
                const value = obj[(_b = shapeField.alias) !== null && _b !== void 0 ? _b : shapeField.name];
                manager.set(ctx, id, field, variablesCode, variables, value);
                if (value !== undefined && shapeField.childShape !== undefined) {
                    const associationRecordManager = this.entityManager.recordManager(shapeField.childShape.typeName);
                    switch (field.category) {
                        case "REFERENCE":
                            associationRecordManager.save(ctx, shapeField.childShape, value);
                            break;
                        case "LIST":
                            if (Array.isArray(value)) {
                                for (const element of value) {
                                    associationRecordManager.save(ctx, shapeField.childShape, element);
                                }
                            }
                            break;
                        case "CONNECTION":
                            const edges = value.edges;
                            if (Array.isArray(edges)) {
                                for (const edge of value) {
                                    associationRecordManager.save(ctx, shapeField.childShape, edge.node);
                                }
                            }
                            break;
                    }
                }
            }
        }
    }
    set(ctx, id, field, variablesCode, variables, value) {
        const record = this.saveId(ctx, id);
        record.set(ctx, this.entityManager, field, variablesCode, variables, value);
    }
}
exports.RecordManager = RecordManager;
