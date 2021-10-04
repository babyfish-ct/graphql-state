"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityManager = void 0;
const BatchEntityRequest_1 = require("./BatchEntityRequest");
const RecordManager_1 = require("./RecordManager");
const RuntimeShape_1 = require("./RuntimeShape");
class EntityManager {
    constructor(schema) {
        this.schema = schema;
        this.recordManagerMap = new Map();
        this.batchEntityRequest = new BatchEntityRequest_1.BatchEntityRequest(this);
    }
    recordManager(typeName) {
        const type = this.schema.typeMap.get(typeName);
        if (type === undefined) {
            throw new Error(`Illegal type "${typeName}" that is not exists in schema`);
        }
        let recordManager = this.recordManagerMap.get(typeName);
        if (recordManager === undefined) {
            recordManager = new RecordManager_1.RecordManager(this, type);
            this.recordManagerMap.set(typeName, recordManager);
            recordManager.initializeOtherManagers();
        }
        return recordManager;
    }
    findById(typeName, id) {
        return this.recordManager(typeName).findById(id);
    }
    saveId(ctx, typeName, id) {
        return this.recordManager(typeName).saveId(ctx, id);
    }
    save(ctx, fetcher, obj, variables) {
        const shape = RuntimeShape_1.toRuntimeShape(fetcher, variables);
        return this.recordManager(fetcher.fetchableType.name).save(ctx, shape, obj);
    }
    loadByIds(ids, shape) {
        console.log(ids, JSON.stringify(shape));
        throw new Error("bathcLoad is not implemented");
    }
}
exports.EntityManager = EntityManager;
