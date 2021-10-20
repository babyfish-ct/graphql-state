"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryResult = void 0;
const QueryService_1 = require("./QueryService");
const VariableArgs_1 = require("./VariableArgs");
class QueryResult {
    constructor(entityManager, queryArgs) {
        this.entityManager = entityManager;
        this.queryArgs = queryArgs;
        this._refCount = 0;
        this._loadable = { loading: true };
        this._invalid = true;
        this._currentAsyncRequestId = 0;
        this._evictListener = this.onEntityEvict.bind(this);
        this._changeListener = this.onEntityChange.bind(this);
        entityManager.addEvictListener(undefined, this._evictListener);
        entityManager.addChangeListener(undefined, this._changeListener);
    }
    retain() {
        this._refCount++;
        return this;
    }
    release() {
        if (--this._refCount === 0) {
            this.entityManager.removeEvictListener(undefined, this._evictListener);
            this.entityManager.removeChangeListener(undefined, this._changeListener);
            return true;
        }
        return false;
    }
    get promise() {
        if (this._invalid) {
            this._promise = this.query();
            this._invalid = false;
        }
        return this._promise;
    }
    get loadable() {
        this.promise;
        return this._loadable;
    }
    query() {
        return __awaiter(this, void 0, void 0, function* () {
            const rawResult = new QueryService_1.QueryService(this.entityManager).query(this.queryArgs);
            if (rawResult.type === 'cached') {
                this.refreshDependencies(rawResult.data);
                this._loadable = { loading: false, data: rawResult.data };
                this.entityManager.stateManager.publishQueryResultChangeEvent({
                    queryResult: this,
                    changedType: "ASYNC_STATE_CHANGE"
                });
                return rawResult.data;
            }
            if (!this._loadable.loading) {
                this._loadable = Object.assign(Object.assign({}, this._loadable), { loading: true });
                this.entityManager.stateManager.publishQueryResultChangeEvent({
                    queryResult: this,
                    changedType: "ASYNC_STATE_CHANGE"
                });
            }
            const asyncRequestId = ++this._currentAsyncRequestId;
            this.retain(); // Self holding during Async computing
            try {
                const data = yield rawResult.promise;
                if (this._currentAsyncRequestId === asyncRequestId) {
                    this.refreshDependencies(data);
                    this._loadable = {
                        data,
                        loading: false
                    };
                }
            }
            catch (ex) {
                if (this._currentAsyncRequestId === asyncRequestId) {
                    this._loadable = {
                        loading: false,
                        error: ex
                    };
                }
                throw ex;
            }
            finally {
                try {
                    if (this._currentAsyncRequestId === asyncRequestId) {
                        this.entityManager.stateManager.publishQueryResultChangeEvent({
                            queryResult: this,
                            changedType: "ASYNC_STATE_CHANGE"
                        });
                    }
                }
                finally {
                    this.entityManager.release(this.queryArgs); // Self holding during Async computing
                }
            }
        });
    }
    refreshDependencies(data) {
        const dependencies = new Dependencies();
        dependencies.accept(this.entityManager.schema, this.queryArgs.shape, data);
        this._dependencies = dependencies;
    }
    onEntityEvict(e) {
        var _a;
        if (((_a = this._dependencies) === null || _a === void 0 ? void 0 : _a.isAffectedByEvictEvent(e)) === true) {
            this.invalidate();
        }
    }
    onEntityChange(e) {
        var _a;
        if (((_a = this._dependencies) === null || _a === void 0 ? void 0 : _a.isAffectedByChangeEvent(e)) === true) {
            this.invalidate();
        }
    }
    invalidate() {
        if (!this._invalid) {
            this._invalid = true;
            this.entityManager.stateManager.publishQueryResultChangeEvent({
                queryResult: this,
                changedType: "RESULT_CHANGE"
            });
        }
    }
}
exports.QueryResult = QueryResult;
class Dependencies {
    constructor() {
        this.map = new Map();
    }
    accept(schema, shape, obj) {
        this.handleInsertion(schema, shape, false);
        this.handleObjectChange(schema, shape, obj);
    }
    isAffectedByEvictEvent(e) {
        var _a;
        const dependency = this.map.get(e.typeName);
        if (dependency !== undefined) {
            if (e.evictedType === "row") {
                return true;
            }
            const changedKeySet = (_a = dependency.idChangedKeyMap) === null || _a === void 0 ? void 0 : _a.get(e.id);
            if (changedKeySet !== undefined) {
                for (const changedKey of e.evictedKeys) {
                    if (typeof changedKey === "string" && changedKeySet.has(changedKey)) {
                        return true;
                    }
                    if (typeof changedKey === "object" && changedKeySet.has(VariableArgs_1.VariableArgs.fieldKey(changedKey.name, changedKey.variables))) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    isAffectedByChangeEvent(e) {
        var _a;
        const dependency = this.map.get(e.typeName);
        if (dependency !== undefined) {
            if (e.changedType === "delete") {
                return true;
            }
            if (e.changedType === "insert" && dependency.handleInsertion) {
                return true;
            }
            const changedKeySet = (_a = dependency.idChangedKeyMap) === null || _a === void 0 ? void 0 : _a.get(e.id);
            if (changedKeySet !== undefined) {
                for (const changedKey of e.changedKeys) {
                    if (typeof changedKey === "string" && changedKeySet.has(changedKey)) {
                        return true;
                    }
                    if (typeof changedKey === "object" && changedKeySet.has(VariableArgs_1.VariableArgs.fieldKey(changedKey.name, changedKey.variables))) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    handleInsertion(schema, shape, isLeaf) {
        var _a;
        if (isLeaf && ((_a = schema.typeMap.get(shape.typeName)) === null || _a === void 0 ? void 0 : _a.category) === 'OBJECT') {
            let dependency = this.map.get(shape.typeName);
            if (dependency === undefined) {
                dependency = {
                    handleInsertion: true,
                    idChangedKeyMap: new Map()
                };
                this.map.set(shape.typeName, dependency);
            }
            else {
                dependency.handleInsertion || (dependency.handleInsertion = true);
            }
        }
        for (const [, field] of shape.fieldMap) {
            const childShape = field.childShape;
            if (childShape !== undefined) {
                this.handleInsertion(schema, childShape, true);
            }
        }
    }
    handleObjectChange(schema, shape, obj) {
        var _a;
        if (Array.isArray(obj)) {
            for (const element of obj) {
                this.handleObjectChange(schema, shape, element);
            }
        }
        else {
            const type = schema.typeMap.get(shape.typeName);
            if (obj !== undefined) {
                if (type.name !== 'Query' && type.category !== 'CONNECTION' && type.category !== 'EDGE') {
                    let dependency = this.map.get(shape.typeName);
                    if (dependency === undefined) {
                        dependency = {
                            handleInsertion: false,
                            idChangedKeyMap: new Map()
                        };
                        this.map.set(shape.typeName, dependency);
                    }
                    const idFieldName = schema.typeMap.get(shape.typeName).idField.name;
                    const id = obj[idFieldName];
                    for (const [, field] of shape.fieldMap) {
                        if (field.name !== idFieldName) {
                            let changedKeySet = dependency.idChangedKeyMap.get(id);
                            if (changedKeySet === undefined) {
                                changedKeySet = new Set();
                                dependency.idChangedKeyMap.set(id, changedKeySet);
                            }
                            changedKeySet.add(VariableArgs_1.VariableArgs.fieldKey(field.name, field.args));
                        }
                    }
                }
                for (const [, field] of shape.fieldMap) {
                    const childShape = field.childShape;
                    if (childShape !== undefined) {
                        this.handleObjectChange(schema, childShape, obj[(_a = field.alias) !== null && _a !== void 0 ? _a : field.name]);
                    }
                }
            }
        }
    }
}
