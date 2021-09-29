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
    findById(id) {
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
            record.undeleted();
            ctx.update(record);
        }
        else {
            record = new Record_1.Record(this.type, id);
            this.recordMap.set(id, record);
            ctx.insert(record);
        }
        (_a = this.superManager) === null || _a === void 0 ? void 0 : _a.saveId(ctx, id);
        return record;
    }
    save(ctx, obj) {
        var _a;
        if (typeof obj !== "object" || Array.isArray(obj)) {
            throw new Error("obj can only be plain object");
        }
        const idFieldName = this.type.idField.name;
        const id = obj[idFieldName];
        const fieldMap = this.type.fieldMap;
        for (const fieldName in obj) {
            if (fieldName !== idFieldName) {
                const manager = (_a = this.fieldManagerMap.get(fieldName)) !== null && _a !== void 0 ? _a : this;
                manager.set(ctx, id, fieldName, fieldMap.get(fieldName), undefined, undefined, obj[fieldName]);
            }
        }
    }
    set(ctx, id, fieldName, field, variablesCode, variables, value) {
        const record = this.saveId(ctx, id);
        record.set(ctx, this.entityManager, fieldName, field, variablesCode, variables, value);
    }
}
exports.RecordManager = RecordManager;
