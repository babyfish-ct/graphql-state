"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityManager = void 0;
const BatchEntityRequest_1 = require("./BatchEntityRequest");
const QueryResult_1 = require("./QueryResult");
const RecordManager_1 = require("./RecordManager");
class EntityManager {
    constructor(stateManager, schema) {
        this.stateManager = stateManager;
        this.schema = schema;
        this.recordManagerMap = new Map();
        this.queryResultMap = new Map();
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
    findRefById(typeName, id) {
        return this.recordManager(typeName).findRefById(id);
    }
    saveId(ctx, typeName, id) {
        return this.recordManager(typeName).saveId(ctx, id);
    }
    save(ctx, shape, obj) {
        return this.recordManager(shape.typeName).save(ctx, shape, obj);
    }
    delete(ctx, typeName, id) {
        return this.recordManager(typeName).delete(ctx, id);
    }
    loadByIds(ids, shape) {
        throw new Error("bathcLoad is not implemented");
    }
    retain(queryArgs) {
        const key = this.queryKeyOf(queryArgs.shape, queryArgs.ids);
        let result = this.queryResultMap.get(key);
        if (result === undefined) {
            result = new QueryResult_1.QueryResult(this, queryArgs);
            this.queryResultMap.set(key, result);
        }
        return result.retain();
    }
    release(queryArgs) {
        const key = this.queryKeyOf(queryArgs.shape, queryArgs.ids);
        const result = this.queryResultMap.get(key);
        if ((result === null || result === void 0 ? void 0 : result.release()) === true) {
            this.queryResultMap.delete(key);
        }
    }
    queryKeyOf(shape, ids) {
        return ids === undefined ? shape.toString() : `${shape.toString()}${JSON.stringify(ids)}`;
    }
}
exports.EntityManager = EntityManager;
