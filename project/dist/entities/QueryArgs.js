"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryArgs = void 0;
const Args_1 = require("../state/impl/Args");
const PaginationFetcherProcessor_1 = require("./PaginationFetcherProcessor");
const RuntimeShape_1 = require("./RuntimeShape");
class QueryArgs {
    constructor(shape, fetcher, pagination, ids, optionArgs) {
        var _a, _b;
        this.shape = shape;
        this.fetcher = fetcher;
        this.pagination = pagination;
        this.ids = ids;
        this.optionArgs = optionArgs;
        const variables = (_a = optionArgs === null || optionArgs === void 0 ? void 0 : optionArgs.variableArgs) === null || _a === void 0 ? void 0 : _a.variables;
        if (variables !== undefined && variables[PaginationFetcherProcessor_1.GRAPHQL_STATE_PAGINATION_INFO] !== undefined) {
            this._hasPaginationInfo = true;
        }
        if (ids === undefined && optionArgs === undefined) {
            this._key = shape.toString();
        }
        else {
            this._key = `${shape.toString()}:${(_b = optionArgs === null || optionArgs === void 0 ? void 0 : optionArgs.key) !== null && _b !== void 0 ? _b : ""}:${ids !== undefined ? JSON.stringify(ids) : ""}`;
        }
    }
    get key() {
        return this._key;
    }
    static create(fetcher, pagination, ids, optionArgs) {
        var _a, _b, _c, _d, _e;
        if (fetcher.fetchableType.name === 'Query' && ids !== undefined) {
            throw new Error("Generic query does not support id");
        }
        else if (fetcher.fetchableType.name !== 'Query' && ids === undefined) {
            throw new Error("id/ids is required for object query");
        }
        if (pagination !== undefined) {
            const [connName, connAlias, paginationFetcher] = new PaginationFetcherProcessor_1.PaginationFetcherProcessor(pagination.schema).process(fetcher);
            const queryOptions = optionArgs.options;
            return new QueryArgs(RuntimeShape_1.toRuntimeShape(fetcher, connName, (_a = optionArgs === null || optionArgs === void 0 ? void 0 : optionArgs.variableArgs) === null || _a === void 0 ? void 0 : _a.variables), paginationFetcher, {
                loadMode: pagination.loadMode,
                windowId: queryOptions.windowId,
                connName,
                connAlias,
                style: (_b = queryOptions.paginiationStyle) !== null && _b !== void 0 ? _b : "forward",
                initialSize: queryOptions.initialSize,
                pageSize: (_c = queryOptions.pageSize) !== null && _c !== void 0 ? _c : queryOptions.initialSize
            }, ids, optionArgs).withPaginationInfo();
        }
        let filteredIds = ids;
        if (ids !== undefined) {
            filteredIds = ids.filter(id => id !== undefined && id !== null);
            if (filteredIds.length < ids.length && ((_d = optionArgs === null || optionArgs === void 0 ? void 0 : optionArgs.options) === null || _d === void 0 ? void 0 : _d.objectStyle) !== "optional") {
                throw new Error("undefined or null id not acceptable for object query whose object style is 'required'");
            }
        }
        return new QueryArgs(RuntimeShape_1.toRuntimeShape(fetcher, undefined, (_e = optionArgs === null || optionArgs === void 0 ? void 0 : optionArgs.variableArgs) === null || _e === void 0 ? void 0 : _e.variables), fetcher, undefined, filteredIds, optionArgs);
    }
    newArgs(ids) {
        if (this.ids === undefined) {
            throw new Error(`The function 'missed' is not supported because the current query args is used for object query`);
        }
        return new QueryArgs(this.shape, this.fetcher, undefined, ids, this.optionArgs);
    }
    contains(args) {
        if (this === args) {
            return true;
        }
        return containsIds(this.ids, args.ids) && containsShape(this.shape, args.shape);
    }
    variables(variables) {
        var _a, _b, _c, _d, _e;
        const deltaVariables = variables instanceof Args_1.VariableArgs ?
            variables.variables :
            variables;
        const optionArgs = Args_1.OptionArgs.of(Object.assign(Object.assign({}, (_a = this.optionArgs) === null || _a === void 0 ? void 0 : _a.options), { variables: Object.assign(Object.assign({}, (_c = (_b = this.optionArgs) === null || _b === void 0 ? void 0 : _b.options) === null || _c === void 0 ? void 0 : _c.variables), deltaVariables) }));
        return new QueryArgs(RuntimeShape_1.toRuntimeShape(this.fetcher, (_d = this.pagination) === null || _d === void 0 ? void 0 : _d.connName, (_e = optionArgs === null || optionArgs === void 0 ? void 0 : optionArgs.variableArgs) === null || _e === void 0 ? void 0 : _e.variables), this.fetcher, this.pagination, this.ids, optionArgs);
    }
    withPaginationInfo() {
        if (this.pagination === undefined || this._hasPaginationInfo) {
            return this;
        }
        let w = this._withPaginationInfo;
        if (w === undefined) {
            const paginationInfo = {
                windowId: this.pagination.windowId,
                style: this.pagination.style,
                initialSize: this.pagination.initialSize
            };
            this._withPaginationInfo = w = this.variables({
                [PaginationFetcherProcessor_1.GRAPHQL_STATE_PAGINATION_INFO]: paginationInfo
            });
            w._withoutPaginationInfo = this;
        }
        return w;
    }
    withoutPaginationInfo() {
        if (this.pagination === undefined || !this._hasPaginationInfo) {
            return this;
        }
        let wo = this._withoutPaginationInfo;
        if (wo === undefined) {
            this._withoutPaginationInfo = wo = this.variables({
                [PaginationFetcherProcessor_1.GRAPHQL_STATE_PAGINATION_INFO]: undefined
            });
            wo._withPaginationInfo = this;
        }
        return wo;
    }
}
exports.QueryArgs = QueryArgs;
function containsIds(a, b) {
    if (a === undefined || b === undefined) {
        if (a !== b) {
            throw new Error("Internal bug: containsIds accept defined ids and undefined ids");
        }
        return true;
    }
    if (a.length < b.length) {
        return false;
    }
    for (const id of b) {
        if (a.findIndex(e => e === id) === -1) {
            return false;
        }
    }
    return true;
}
function containsShape(a, b) {
    var _a, _b;
    if (a === undefined || b === undefined) {
        if (a !== b) {
            throw new Error("Internal bug: containsShape accept defined shape and undefined shape");
        }
        return true;
    }
    if (a.typeName !== b.typeName) {
        return false;
    }
    for (const [fieldName, field] of b.fieldMap) {
        const fieldA = a.fieldMap.get(fieldName);
        if (fieldA === undefined) {
            return false;
        }
        if (((_a = fieldA === null || fieldA === void 0 ? void 0 : fieldA.args) === null || _a === void 0 ? void 0 : _a.key) !== ((_b = field === null || field === void 0 ? void 0 : field.args) === null || _b === void 0 ? void 0 : _b.key)) {
            return false;
        }
        if (!containsShape(fieldA.childShape, field.childShape)) {
            return false;
        }
    }
    return true;
}
