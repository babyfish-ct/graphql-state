"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryArgs = exports.QueryResult = void 0;
const QueryService_1 = require("./QueryService");
const RuntimeShape_1 = require("./RuntimeShape");
class QueryResult {
    constructor(entityManager, queryArgs) {
        this.entityManager = entityManager;
        this.queryArgs = queryArgs;
        this._refCount = 0;
        this._loadable = { loading: true };
        this._invalid = true;
        this._asyncRequestId = 0;
    }
    retain() {
        this._refCount++;
        return this;
    }
    release() {
        if (--this._refCount === 0) {
            this.acceptData(undefined);
            return true;
        }
        return false;
    }
    get promise() {
        if (this._invalid) {
            let promise;
            const queryService = new QueryService_1.QueryService(this.entityManager);
            if (this.queryArgs.ids !== undefined) {
                promise = queryService.queryObjects(this.queryArgs.ids, this.queryArgs.shape);
            }
            else {
                promise = queryService.query(this.queryArgs.shape);
            }
            const asyncRequestId = this._asyncRequestId;
            if (!this._loadable.loading) {
                this._loadable = Object.assign(Object.assign({}, this._loadable), { loading: true });
            }
            this._promise =
                promise
                    .then(data => {
                    if (this._asyncRequestId === asyncRequestId) {
                        this._loadable = {
                            data,
                            loading: false
                        };
                    }
                    this.acceptData(data);
                    return data;
                })
                    .catch(error => {
                    if (this._asyncRequestId === asyncRequestId) {
                        this._loadable = {
                            error,
                            loading: false
                        };
                    }
                    return error;
                })
                    .finally(() => {
                    if (this._asyncRequestId === asyncRequestId) {
                        this.entityManager.stateManager.publishQueryResultChangeEvent({
                            queryResult: this,
                            changedType: "ASYNC_STATE_CHANGE"
                        });
                    }
                });
            this._invalid = false;
        }
        return this._promise;
    }
    get loadable() {
        this.promise;
        return this._loadable;
    }
    acceptData(data) {
        const l = this._listener;
        if (l !== undefined) {
            this._listener = undefined;
            this.entityManager.stateManager.removeListener(l);
        }
        if (data !== undefined) {
            const dependencies = new Dependencies();
            dependencies.accept(this.entityManager.schema, this.queryArgs.shape, data);
            const listener = (e) => {
                if (dependencies.has(e)) {
                    this.invalidate();
                }
            };
            this._listener = listener;
            this.entityManager.stateManager.addListener(listener);
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
class QueryArgs {
    constructor(fetcher, ids, variables) {
        this.fetcher = fetcher;
        this.ids = ids;
        this.variables = variables;
        if (fetcher.fetchableType.name === 'Query' && ids !== undefined) {
            throw new Error("Generic query does not support id");
        }
        else if (fetcher.fetchableType.name !== 'Query' && ids === undefined) {
            throw new Error("Id is required for object query");
        }
        this._shape = RuntimeShape_1.toRuntimeShape(fetcher, variables);
    }
    get shape() {
        return this._shape;
    }
}
exports.QueryArgs = QueryArgs;
class Dependencies {
    constructor() {
        this.map = new Map();
    }
    accept(schema, shape, obj) {
        this.handleInsertion(schema, shape);
        this.handleObjectChange(schema, shape, obj);
    }
    has(e) {
        var _a;
        const dependency = this.map.get(e.typeName);
        if (dependency !== undefined) {
            if (e.changedType === "DELETE") {
                return true;
            }
            if (e.changedType === "INSERT" && dependency.handleInsertion) {
                return true;
            }
            const changedKeySet = (_a = dependency.idChangedKeyMap) === null || _a === void 0 ? void 0 : _a.get(e.id);
            if (changedKeySet !== undefined) {
                for (const changedKey of e.changedKeys) {
                    if (typeof changedKey === "string" && changedKeySet.has(changedKeyString(changedKey))) {
                        return true;
                    }
                    if (typeof changedKey === "object" && changedKeySet.has(changedKeyString(changedKey.name, changedKey.variables))) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    handleInsertion(schema, shape) {
        const type = schema.typeMap.get(shape.typeName);
        if (type.name === 'Query' || type.category === 'CONNECTION' || type.category === 'EDGE') {
            for (const field of shape.fields) {
                const childShape = field.childShape;
                if (childShape !== undefined) {
                    let dependency = this.map.get(childShape.typeName);
                    if (dependency === undefined) {
                        dependency = {
                            handleInsertion: true,
                            idChangedKeyMap: new Map()
                        };
                        this.map.set(childShape.typeName, dependency);
                    }
                    else {
                        dependency.handleInsertion || (dependency.handleInsertion = true);
                    }
                }
            }
        }
    }
    handleObjectChange(schema, shape, obj) {
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
                    for (const field of shape.fields) {
                        if (field.name !== idFieldName) {
                            let changedKeySet = dependency.idChangedKeyMap.get(id);
                            if (changedKeySet === undefined) {
                                changedKeySet = new Set();
                                dependency.idChangedKeyMap.set(id, changedKeySet);
                            }
                            changedKeySet.add(changedKeyString(field.name, field.variables));
                        }
                    }
                }
                for (const field of shape.fields) {
                    const childShape = field.childShape;
                    if (childShape !== undefined) {
                        this.handleObjectChange(schema, childShape, obj[field.name]);
                    }
                }
            }
        }
    }
}
function changedKeyString(fieldName, variables) {
    const vsCode = variables !== undefined ? JSON.stringify(variables) : undefined;
    if (vsCode === undefined || vsCode === '{}') {
        return fieldName;
    }
    return `${fieldName}:${vsCode}`;
}
