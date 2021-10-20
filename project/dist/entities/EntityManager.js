"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityManager = void 0;
const BatchDataService_1 = require("../data/BatchDataService");
const RemoteDataService_1 = require("../data/RemoteDataService");
const ModificationContext_1 = require("./ModificationContext");
const QueryResult_1 = require("./QueryResult");
const Record_1 = require("./Record");
const RecordManager_1 = require("./RecordManager");
class EntityManager {
    constructor(stateManager, schema) {
        this.stateManager = stateManager;
        this.schema = schema;
        this._recordManagerMap = new Map();
        this._queryResultMap = new Map();
        this._evictListenerMap = new Map();
        this._changeListenerMap = new Map();
        this.dataService = new BatchDataService_1.BatchDataService(new RemoteDataService_1.RemoteDataService(this));
        const queryType = schema.typeMap.get("Query");
        if (queryType !== undefined) {
            this._queryRecord = this.saveId("Query", Record_1.QUERY_OBJECT_ID);
        }
        const mutationType = schema.typeMap.get("Mutation");
        if (mutationType !== undefined) {
            this._mutationRecord = this.saveId("Mutation", Record_1.MUATION_OBJECT_ID);
        }
    }
    recordManager(typeName) {
        const type = this.schema.typeMap.get(typeName);
        if (type === undefined) {
            throw new Error(`Illegal type "${typeName}" that is not exists in schema`);
        }
        let recordManager = this._recordManagerMap.get(typeName);
        if (recordManager === undefined) {
            recordManager = new RecordManager_1.RecordManager(this, type);
            this._recordManagerMap.set(typeName, recordManager);
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
            this._ctx = new ModificationContext_1.ModificationContext(this.linkToQuery.bind(this), this.publishEvictChangeEvent.bind(this), this.publishEntityChangeEvent.bind(this));
            try {
                return action();
            }
            finally {
                try {
                    this._ctx.close();
                }
                finally {
                    this._ctx = undefined;
                }
            }
        }
    }
    save(shape, objOrArray) {
        this.modify(() => {
            const recordManager = this.recordManager(shape.typeName);
            if (Array.isArray(objOrArray)) {
                for (const obj of objOrArray) {
                    recordManager.save(shape, obj);
                }
            }
            else if (objOrArray !== undefined && objOrArray !== null) {
                recordManager.save(shape, objOrArray);
            }
        });
    }
    delete(typeName, idOrArray) {
        if (typeName === 'Query') {
            throw new Error(`The typeof deleted object cannot be the special type 'Query'`);
        }
        this.modify(() => {
            const recordManager = this.recordManager(typeName);
            if (Array.isArray(idOrArray)) {
                for (const id of idOrArray) {
                    recordManager.delete(id);
                }
            }
            else {
                recordManager.delete(idOrArray);
            }
        });
    }
    saveId(typeName, id) {
        return this.modify(() => {
            return this.recordManager(typeName).saveId(id);
        });
    }
    retain(args) {
        let result = this._queryResultMap.get(args.key);
        if (result === undefined) {
            result = new QueryResult_1.QueryResult(this, args);
            this._queryResultMap.set(args.key, result);
        }
        return result.retain();
    }
    release(args) {
        const result = this._queryResultMap.get(args.key);
        if ((result === null || result === void 0 ? void 0 : result.release()) === true) {
            this._queryResultMap.delete(args.key);
        }
    }
    addEvictListener(typeName, listener) {
        if (listener !== undefined && listener !== null) {
            let set = this._evictListenerMap.get(typeName);
            if (set === undefined) {
                set = new Set();
                this._evictListenerMap.set(typeName, set);
            }
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }
    removeEvictListener(typeName, listener) {
        var _a;
        (_a = this._evictListenerMap.get(typeName)) === null || _a === void 0 ? void 0 : _a.delete(listener);
    }
    publishEvictChangeEvent(e) {
        for (const [, set] of this._evictListenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }
    addChangeListener(typeName, listener) {
        if (listener !== undefined && listener !== null) {
            let set = this._changeListenerMap.get(typeName);
            if (set === undefined) {
                set = new Set();
                this._changeListenerMap.set(typeName, set);
            }
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }
    removeChangeListener(typeName, listener) {
        var _a;
        (_a = this._changeListenerMap.get(typeName)) === null || _a === void 0 ? void 0 : _a.delete(listener);
    }
    publishEntityChangeEvent(e) {
        for (const [, set] of this._changeListenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }
    linkToQuery(type, id) {
        const qr = this._queryRecord;
        if (qr !== undefined) {
            const record = this.saveId(type.name, id);
            for (const [, field] of qr.type.fieldMap) {
                if (field.targetType !== undefined && field.targetType.isAssignableFrom(type)) {
                    qr.link(this, field, record);
                }
            }
        }
    }
}
exports.EntityManager = EntityManager;
