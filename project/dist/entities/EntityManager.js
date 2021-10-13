"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityManager = void 0;
const BatchEntityRequest_1 = require("./BatchEntityRequest");
const ModificationContext_1 = require("./ModificationContext");
const QueryResult_1 = require("./QueryResult");
const RecordManager_1 = require("./RecordManager");
class EntityManager {
    constructor(stateManager, schema) {
        this.stateManager = stateManager;
        this.schema = schema;
        this.recordManagerMap = new Map();
        this.queryResultMap = new Map();
        this.batchEntityRequest = new BatchEntityRequest_1.BatchEntityRequest(this);
        this._entityChangeListenerMap = new Map();
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
    get modificationContext() {
        const ctx = this._ctx;
        if (ctx === undefined) {
            throw new Error(`No modificaton context`);
        }
        return ctx;
    }
    modify(action) {
        if (this._ctx !== undefined) {
            return action();
        }
        else {
            this._ctx = new ModificationContext_1.ModificationContext(this.linkToQuery.bind(this), this.publishEntityChangeEvent.bind(this));
            try {
                return action();
            }
            finally {
                const ctx = this._ctx;
                this._ctx = undefined;
                ctx.close();
            }
        }
    }
    save(shape, objOrArray) {
        if (shape.typeName === 'Query') {
            throw new Error(`The typeof saved object cannot be the special type 'Query'`);
        }
        const recordManager = this.recordManager(shape.typeName);
        if (Array.isArray(objOrArray)) {
            for (const obj of objOrArray) {
                recordManager.save(shape, obj);
            }
        }
        else if (objOrArray !== undefined && objOrArray !== null) {
            recordManager.save(shape, objOrArray);
        }
    }
    delete(typeName, idOrArray) {
        if (typeName === 'Query') {
            throw new Error(`The typeof deleted object cannot be the special type 'Query'`);
        }
        const ctx = new ModificationContext_1.ModificationContext(this.linkToQuery.bind(this), this.publishEntityChangeEvent.bind(this));
        if (Array.isArray(idOrArray)) {
            for (const id of idOrArray) {
                this.recordManager(typeName).delete(id);
            }
        }
        else {
            this.recordManager(typeName).delete(idOrArray);
        }
        ctx.close();
    }
    saveId(typeName, id) {
        if (typeName === 'Query') {
            throw new Error(`typeName cannot be 'Query'`);
        }
        return this.recordManager(typeName).saveId(id);
    }
    loadByIds(ids, shape) {
        if (shape.typeName === 'Query') {
            throw new Error(`typeName cannot be 'Query'`);
        }
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
    addListener(typeName, listener) {
        if (listener !== undefined && listener !== null) {
            let set = this._entityChangeListenerMap.get(typeName);
            if (set === undefined) {
                set = new Set();
                this._entityChangeListenerMap.set(typeName, set);
            }
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }
    removeListener(typeName, listener) {
        var _a;
        (_a = this._entityChangeListenerMap.get(typeName)) === null || _a === void 0 ? void 0 : _a.delete(listener);
    }
    linkToQuery(type, id) {
    }
    publishEntityChangeEvent(e) {
        for (const [, set] of this._entityChangeListenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }
    queryKeyOf(shape, ids) {
        return ids === undefined ? shape.toString() : `${shape.toString()}${JSON.stringify(ids)}`;
    }
}
exports.EntityManager = EntityManager;
