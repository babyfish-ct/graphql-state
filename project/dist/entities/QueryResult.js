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
        return --this._refCount === 0;
    }
    get promise() {
        if (this._invalid) {
            let promise;
            const queryService = new QueryService_1.QueryService(this.entityManager);
            if (this.queryArgs.id !== undefined) {
                promise = queryService.queryObject(this.queryArgs.id, this.queryArgs.shape);
            }
            else {
                promise = queryService.query(this.queryArgs.shape);
            }
            const asyncRequestId = this._asyncRequestId;
            this._promise =
                promise
                    .then(data => {
                    if (this._asyncRequestId === asyncRequestId) {
                        this._loadable = {
                            data,
                            loading: false
                        };
                    }
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
                        // TODO:
                    }
                });
            this._invalid = false;
        }
        return this._promise;
    }
    get loadable() {
        return this._loadable;
    }
}
exports.QueryResult = QueryResult;
class QueryArgs {
    constructor(fetcher, id, variables) {
        this.fetcher = fetcher;
        this.id = id;
        this.variables = variables;
        if (fetcher.fetchableType.name === 'Query' && id !== undefined) {
            throw new Error("Generic query does not support id");
        }
        else if (fetcher.fetchableType.name !== 'Query' && id === undefined) {
            throw new Error("Id is required for object query");
        }
        this._shape = RuntimeShape_1.toRuntimeShape(fetcher, variables);
    }
    get shape() {
        return this._shape;
    }
}
exports.QueryArgs = QueryArgs;
