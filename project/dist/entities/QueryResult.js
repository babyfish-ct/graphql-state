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
const Args_1 = require("../state/impl/Args");
const QueryService_1 = require("./QueryService");
const Record_1 = require("./Record");
class QueryResult {
    constructor(entityManager, queryArgs, disposer) {
        this.entityManager = entityManager;
        this.queryArgs = queryArgs;
        this.disposer = disposer;
        this._refCount = 0;
        this._invalid = true;
        this._refetching = false;
        this._currentAsyncRequestId = 0;
        this._disposeTimerId = undefined;
        this._createdMillis = new Date().getTime();
        this._evictListener = this.onEntityEvict.bind(this);
        this._changeListener = this.onEntityChange.bind(this);
        entityManager.addEvictListener(undefined, this._evictListener);
        entityManager.addChangeListener(undefined, this._changeListener);
        this._bindedRefetch = this._refetch.bind(this);
        this._loadable = {
            loading: true,
            refetch: this._bindedRefetch
        };
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
            this._invalid = false;
            this._promise = this.execute();
        }
        return this._promise;
    }
    get loadable() {
        this.promise;
        return this._loadable;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.query();
            }
            finally {
                this._refetching = false;
            }
        });
    }
    query() {
        return __awaiter(this, void 0, void 0, function* () {
            const rawResult = new QueryService_1.QueryService(this.entityManager)
                .query(this.queryArgs, !this._refetching, this.mode === "cache-and-network");
            if (rawResult.type === 'cached') {
                const data = this.validateData(rawResult.data);
                this.refreshDependencies(data);
                this._loadable = {
                    loading: false,
                    data: data,
                    refetch: this._bindedRefetch
                };
                this.entityManager.stateManager.publishQueryResultChangeEvent({
                    queryResult: this,
                    changedType: "ASYNC_STATE_CHANGE"
                });
                return data;
            }
            if (!this._loadable.loading) {
                this._loadable = { loading: true, refetch: this._loadable.refetch };
                this.entityManager.stateManager.publishQueryResultChangeEvent({
                    queryResult: this,
                    changedType: "ASYNC_STATE_CHANGE"
                });
            }
            const asyncRequestId = ++this._currentAsyncRequestId;
            this.retain(); // Self holding during Async computing
            try {
                const data = this.validateData(yield rawResult.promise);
                if (this._currentAsyncRequestId === asyncRequestId) {
                    this.refreshDependencies(data);
                    this._loadable = {
                        data,
                        loading: false,
                        refetch: this._bindedRefetch
                    };
                }
                return data;
            }
            catch (ex) {
                if (this._currentAsyncRequestId === asyncRequestId) {
                    this._loadable = {
                        loading: false,
                        error: ex,
                        refetch: this._bindedRefetch
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
        this.entityManager.removeEvictListener(undefined, this._evictListener);
        this.entityManager.removeChangeListener(undefined, this._changeListener);
        this.disposer();
    }
    _refetch() {
        if (this.mode === "cache-only") {
            throw new Error(`cannot refetch the cache-only resource`);
        }
        this.invalidate();
        this._refetching = true;
    }
    get mode() {
        var _a, _b, _c, _d;
        return (_d = (_c = (_b = (_a = this.queryArgs) === null || _a === void 0 ? void 0 : _a.optionArgs) === null || _b === void 0 ? void 0 : _b.options) === null || _c === void 0 ? void 0 : _c.mode) !== null && _d !== void 0 ? _d : "cache-and-network";
    }
    validateData(data) {
        var _a, _b, _c;
        if (this.queryArgs.ids !== undefined) {
            const objectStyle = (_c = (_b = (_a = this.queryArgs.optionArgs) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.objectStyle) !== null && _c !== void 0 ? _c : "required";
            if (objectStyle === "required") {
                const arr = data;
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i] === undefined) {
                        throw new Error(`Cannot find object whose type is "${this.queryArgs.shape.typeName}" and id is "${this.queryArgs.ids[i]}"`);
                    }
                }
            }
        }
        return data;
    }
    gcVisit() {
        const data = this.loadable.data;
        if (data !== undefined) {
            const shape = this.queryArgs.shape;
            this.entityManager.visit(shape, data, (id, _, field, args, value) => {
                var _a;
                if (value === undefined) {
                    return false;
                }
                const record = (_a = this.entityManager.findRefById(field.declaringType.name, id)) === null || _a === void 0 ? void 0 : _a.value;
                if (record !== undefined) {
                    record.gcVisit(field, args);
                }
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
        var _a, _b, _c;
        const typeMetadata = schema.typeMap.get(shape.typeName);
        if (typeMetadata === undefined) {
            throw new Error(`Illegal runtime shape type "${shape.typeName}"`);
        }
        const idFieldName = typeMetadata.idField.name;
        let id;
        if (shape.typeName === "Query") {
            id = Record_1.QUERY_OBJECT_ID;
        }
        else {
            const idShapedField = shape.fieldMap.get(idFieldName);
            if (idShapedField === undefined) {
                throw new Error(`Cannot accept the runtime shape whose type is "${shape.typeName}" without id`);
            }
            id = obj[(_a = idShapedField.alias) !== null && _a !== void 0 ? _a : idShapedField.name];
        }
        for (const [fieldName, field] of shape.fieldMap) {
            if (fieldName !== idFieldName) {
                const fieldMetadata = typeMetadata.fieldMap.get(fieldName);
                if (fieldMetadata === undefined) {
                    throw new Error(`Illegal runtime shape field "${shape.typeName}.${fieldName}"`);
                }
                this.typeDependency(fieldMetadata.declaringType.name).addObjectId(field, id);
                if (field.childShape !== undefined) {
                    const value = obj[(_b = field.alias) !== null && _b !== void 0 ? _b : fieldName];
                    if (value !== undefined) {
                        const category = (_c = typeMetadata.fieldMap.get(field.name)) === null || _c === void 0 ? void 0 : _c.category;
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
    }
    isAffectedBy(e) {
        var _a;
        return ((_a = this.map.get(e.typeName)) === null || _a === void 0 ? void 0 : _a.isAffectedBy(e)) === true;
    }
    typeDependency(typeName) {
        let typeDependency = this.map.get(typeName);
        if (typeDependency === undefined) {
            typeDependency = new TypeDependency();
            this.map.set(typeName, typeDependency);
        }
        return typeDependency;
    }
}
class TypeDependency {
    constructor() {
        this.fieldKeyIdMutlipMap = new Map();
    }
    addObjectId(field, id) {
        const key = Args_1.VariableArgs.fieldKey(field.name, field.args);
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
        if (e.causedByGC || e.evictedType === "row") {
            return;
        }
        for (const entityKey of e.evictedKeys) {
            const key = typeof entityKey === "string" ?
                entityKey :
                Args_1.VariableArgs.fieldKey(entityKey.name, Args_1.VariableArgs.of(entityKey.variables));
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
                Args_1.VariableArgs.fieldKey(entityKey.name, Args_1.VariableArgs.of(entityKey.variables));
            if (((_a = this.fieldKeyIdMutlipMap.get(key)) === null || _a === void 0 ? void 0 : _a.has(e.id)) === true) {
                return true;
            }
        }
        return false;
    }
}
