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
const Record_1 = require("./Record");
const VariableArgs_1 = require("./VariableArgs");
class QueryResult {
    constructor(entityManager, queryArgs, disposer) {
        this.entityManager = entityManager;
        this.queryArgs = queryArgs;
        this.disposer = disposer;
        this._refCount = 0;
        this._loadable = { loading: true };
        this._invalid = true;
        this._currentAsyncRequestId = 0;
        this._disposeTimerId = undefined;
        this._createdMillis = new Date().getTime();
        this._evictListener = this.onEntityEvict.bind(this);
        this._changeListener = this.onEntityChange.bind(this);
        entityManager.addEvictListener(undefined, this._evictListener);
        entityManager.addChangeListener(undefined, this._changeListener);
    }
    retain() {
        this._refCount++;
        return this;
    }
    release(maxDelayMillis) {
        if (--this._refCount === 0) {
            if (maxDelayMillis <= 0) {
                this.dispose();
                return;
            }
            const millis = Math.min(new Date().getTime() - this._createdMillis, maxDelayMillis);
            if (this._disposeTimerId !== undefined) {
                clearTimeout(this._disposeTimerId);
            }
            this._disposeTimerId = setTimeout(() => {
                if (this._refCount === 0) {
                    this.dispose();
                }
            }, millis);
        }
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
        if (((_a = this._dependencies) === null || _a === void 0 ? void 0 : _a.isAffectedBy(e)) === true) {
            this.invalidate();
        }
    }
    onEntityChange(e) {
        var _a;
        if (((_a = this._dependencies) === null || _a === void 0 ? void 0 : _a.isAffectedBy(e)) === true) {
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
    dispose() {
        console.log("dispose", this.queryArgs.variables);
        this.entityManager.removeEvictListener(undefined, this._evictListener);
        this.entityManager.removeChangeListener(undefined, this._changeListener);
        this.disposer();
    }
}
exports.QueryResult = QueryResult;
class Dependencies {
    constructor() {
        this.map = new Map();
    }
    accept(schema, shape, obj) {
        var _a, _b, _c, _d, _e;
        const baseTypeName = shape.typeName;
        const type = schema.typeMap.get(baseTypeName);
        if (type === undefined) {
            throw new Error(`Illegal type "${baseTypeName}"`);
        }
        const typeDependency = this.typeDependency(baseTypeName);
        if (typeDependency.isQuery) {
            const id = Record_1.QUERY_OBJECT_ID;
            for (const [, field] of shape.fieldMap) {
                this
                    .typeDependency((_a = field.declaringTypeName) !== null && _a !== void 0 ? _a : baseTypeName)
                    .addObjectId(field, id);
            }
        }
        else {
            const idFieldName = type.idField.name;
            const idShapedField = shape.fieldMap.get(idFieldName);
            if (idShapedField === undefined) {
                throw new Error(`Cannot accept the runtime shape whose type is "${type.name}" without id`);
            }
            const id = obj[(_b = idShapedField.alias) !== null && _b !== void 0 ? _b : idShapedField.name];
            for (const [, field] of shape.fieldMap) {
                this
                    .typeDependency((_c = field.declaringTypeName) !== null && _c !== void 0 ? _c : baseTypeName)
                    .addObjectId(field, id);
            }
        }
        for (const [fieldName, field] of shape.fieldMap) {
            if (field.childShape !== undefined) {
                const value = obj[(_d = field.alias) !== null && _d !== void 0 ? _d : fieldName];
                if (value !== undefined) {
                    const category = (_e = type.fieldMap.get(field.name)) === null || _e === void 0 ? void 0 : _e.category;
                    if (category === "LIST") {
                        for (const element of value) {
                            this.accept(schema, field.childShape, element);
                        }
                    }
                    else if (category === "CONNECTION") {
                        for (const edge of value.edges) {
                            this.accept(schema, field.nodeShape, edge.node);
                        }
                    }
                    else {
                        this.accept(schema, field.childShape, value);
                    }
                }
            }
        }
    }
    isAffectedBy(e) {
        var _a;
        return ((_a = this.map.get(e.typeName)) === null || _a === void 0 ? void 0 : _a.isAffectedBy(e)) === true;
    }
    typeDependency(typeName) {
        let typeDependency = this.map.get(typeName);
        if (typeDependency === undefined) {
            typeDependency = new TypeDependency(typeName);
            this.map.set(typeName, typeDependency);
        }
        return typeDependency;
    }
}
class TypeDependency {
    constructor(typeName) {
        this.fieldKeyIdMutlipMap = new Map();
        this.isQuery = typeName === "Query";
    }
    addObjectId(field, id) {
        const key = VariableArgs_1.VariableArgs.fieldKey(field.name, field.args);
        let ids = this.fieldKeyIdMutlipMap.get(key);
        if (ids === undefined) {
            ids = new Set();
            this.fieldKeyIdMutlipMap.set(key, ids);
        }
        ids.add(id);
    }
    isAffectedBy(e) {
        return e.eventType === "evict" ?
            this.isAffectedByEvictEvent(e) :
            this.isAffectedByChangeEvent(e);
    }
    isAffectedByEvictEvent(e) {
        if (e.evictedType === "row") {
            return true;
        }
        for (const entityKey of e.evictedKeys) {
            const key = typeof entityKey === "string" ?
                entityKey :
                VariableArgs_1.VariableArgs.fieldKey(entityKey.name, VariableArgs_1.VariableArgs.of(entityKey.variables));
            if (this.fieldKeyIdMutlipMap.has(key) === true) {
                return true;
            }
        }
        return false;
    }
    isAffectedByChangeEvent(e) {
        var _a;
        for (const entityKey of e.changedKeys) {
            const key = typeof entityKey === "string" ?
                entityKey :
                VariableArgs_1.VariableArgs.fieldKey(entityKey.name, VariableArgs_1.VariableArgs.of(entityKey.variables));
            if (((_a = this.fieldKeyIdMutlipMap.get(key)) === null || _a === void 0 ? void 0 : _a.has(e.id)) === true) {
                return true;
            }
        }
        return false;
    }
}
