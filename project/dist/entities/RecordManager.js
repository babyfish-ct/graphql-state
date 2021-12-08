"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordManager = void 0;
const util_1 = require("../state/impl/util");
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
    insertId(id, runtimeType, deleted = false) {
        var _a;
        const superRecord = (_a = this.superManager) === null || _a === void 0 ? void 0 : _a.insertId(id, runtimeType);
        const record = new Record_1.Record(superRecord, this.type, runtimeType, id, deleted);
        this.recordMap.set(id, record);
        return record;
    }
    delete(id) {
        var _a;
        let record = this.recordMap.get(id);
        if (record !== undefined) {
            this.entityManager.modificationContext.delete(record);
            record.delete(this.entityManager);
        }
        else {
            this.insertId(id, this.type, true);
        }
        (_a = this.superManager) === null || _a === void 0 ? void 0 : _a.delete(id);
    }
    evict(id) {
        var _a;
        const record = this.recordMap.get(id);
        if (record !== undefined) {
            this.entityManager.modificationContext.evict(record);
            this.recordMap.delete(id);
            record.dispose(this.entityManager);
        }
        (_a = this.superManager) === null || _a === void 0 ? void 0 : _a.evict(id);
    }
    forEach(visitor) {
        for (const [, record] of this.recordMap) {
            if (visitor(record) === false) {
                break;
            }
        }
    }
    set(id, runtimeType, field, args, value, pagination) {
        const record = this.saveId(id, runtimeType);
        record.set(this.entityManager, field, args, value, pagination);
    }
    refresh(field, e) {
        for (const record of this.recordMap.values()) {
            if (!record.isDeleted) {
                record.refreshByChangeEvent(this.entityManager, field, e);
            }
        }
    }
    collectGarbages(output) {
        for (const record of this.recordMap.values()) {
            if (record.staticType === record.runtimeType) {
                record.collectGarbages(output);
            }
        }
    }
    monitor() {
        const objects = [];
        for (const record of this.recordMap.values()) {
            if (!record.isDeleted) {
                objects.push(record.monitor());
            }
        }
        if (objects.length === 0) {
            return undefined;
        }
        objects.sort((a, b) => util_1.compare(a, b, "id"));
        const type = {
            name: this.type.name,
            objects
        };
        return type;
    }
}
exports.RecordManager = RecordManager;
