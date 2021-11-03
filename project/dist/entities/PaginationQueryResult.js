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
exports.PaginationQueryResult = void 0;
const PaginationFetcherProcessor_1 = require("./PaginationFetcherProcessor");
const QueryArgs_1 = require("./QueryArgs");
const QueryResult_1 = require("./QueryResult");
const QueryService_1 = require("./QueryService");
class PaginationQueryResult extends QueryResult_1.QueryResult {
    constructor(entityManager, queryArgs, disposer) {
        super(entityManager, queryArgs, disposer);
        this._loadMoreRequestId = 0;
        this._bindedLoadNext = this.loadNext.bind(this);
        this._bindedLoadPrevious = this.loadPrevious.bind(this);
        const queryFetcher = this.entityManager.schema.fetcher("Query");
        const connField = this.queryArgs.fetcher.fieldMap.get(this.queryArgs.pagination.connName);
        const loadMoreFetcher = queryFetcher["addField"](this.queryArgs.pagination.connName, connField === null || connField === void 0 ? void 0 : connField.args, connField.childFetchers[0], connField.fieldOptionsValue);
        this._loadNextQueryArgs = QueryArgs_1.QueryArgs.create(loadMoreFetcher, { schema: this.entityManager.schema, loadMode: "next" }, undefined, this.queryArgs.optionArgs);
        this._loadPreviousQueryArgs = QueryArgs_1.QueryArgs.create(loadMoreFetcher, { schema: this.entityManager.schema, loadMode: "previous" }, undefined, this.queryArgs.optionArgs);
    }
    createLoadable(loading, data, error, additionalValues) {
        var _a, _b, _c, _d, _e, _f;
        return super.createLoadable(loading, data, error, Object.assign({ loadNext: this._bindedLoadNext, loadPrevious: this._bindedLoadPrevious, hasNext: (_c = (_b = (_a = this.conn(data)) === null || _a === void 0 ? void 0 : _a.pageInfo) === null || _b === void 0 ? void 0 : _b.hasNextPage) !== null && _c !== void 0 ? _c : false, hasPrevious: (_f = (_e = (_d = this.conn(data)) === null || _d === void 0 ? void 0 : _d.pageInfo) === null || _e === void 0 ? void 0 : _e.hasPreviousPage) !== null && _f !== void 0 ? _f : false, isLoadingNext: false, isLoadingPrevious: false }, additionalValues));
    }
    createQueryService() {
        return this.createPagiantionQueryService(undefined);
    }
    createPagiantionQueryService(data) {
        const conn = this.conn(data !== null && data !== void 0 ? data : this._loadable.data);
        return new QueryService_1.QueryService(this.entityManager, args => {
            var _a, _b;
            const pagination = args.pagination;
            if (pagination.loadMode === "previous" || pagination.style === "backward") {
                return args.variables({
                    [PaginationFetcherProcessor_1.GRAPHQL_STATE_LAST]: pagination.loadMode === "initial" ? pagination.initialSize : pagination.pageSize,
                    [PaginationFetcherProcessor_1.GRAPHQL_STATE_BEFORE]: pagination.loadMode === "initial" ? undefined : (_a = conn === null || conn === void 0 ? void 0 : conn.pageInfo) === null || _a === void 0 ? void 0 : _a.startCursor
                });
            }
            return args.variables({
                [PaginationFetcherProcessor_1.GRAPHQL_STATE_FIRST]: pagination.loadMode === "initial" ? pagination.initialSize : pagination.pageSize,
                [PaginationFetcherProcessor_1.GRAPHQL_STATE_AFTER]: pagination.loadMode === "initial" ? undefined : (_b = conn === null || conn === void 0 ? void 0 : conn.pageInfo) === null || _b === void 0 ? void 0 : _b.endCursor
            });
        });
    }
    loadMore(loadingStatus) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryService = this.createPagiantionQueryService(this._loadable.data); // Create before "_loadable" reset
            this._loadable = this.createLoadable(false, this._loadable.data, this._loadable.error, { [loadingStatus]: true });
            this.entityManager.stateManager.publishQueryResultChangeEvent({
                queryResult: this,
                changedType: "ASYNC_STATE_CHANGE"
            });
            const requestId = ++this._loadMoreRequestId;
            try {
                const result = queryService.query(loadingStatus === "isLoadingNext" ? this._loadNextQueryArgs : this._loadPreviousQueryArgs, false, true);
                if (result.type !== "deferred") {
                    throw new Error("Internal bug: LoadMore only accept deferred result");
                }
                const data = yield result.promise;
                if (this._loadMoreRequestId === requestId) {
                    this._loadable = this.createLoadable(false, data, undefined, { [loadingStatus]: false });
                }
            }
            catch (ex) {
                if (this._loadMoreRequestId === requestId) {
                    this._loadable = this.createLoadable(false, undefined, ex, { [loadingStatus]: false });
                }
                throw ex;
            }
            finally {
                if (this._loadMoreRequestId === requestId) {
                    this.entityManager.stateManager.publishQueryResultChangeEvent({
                        queryResult: this,
                        changedType: "ASYNC_STATE_CHANGE"
                    });
                }
            }
        });
    }
    loadNext() {
        return __awaiter(this, void 0, void 0, function* () {
            const loadable = this.loadable;
            if (loadable.hasNext) {
                this.loadMore("isLoadingNext");
            }
        });
    }
    loadPrevious() {
        return __awaiter(this, void 0, void 0, function* () {
            const loadable = this.loadable;
            if (loadable.hasPrevious) {
                this.loadMore("isLoadingPrevious");
            }
        });
    }
    conn(data) {
        var _a;
        const pagination = this.queryArgs.pagination;
        return data === undefined ?
            undefined :
            data[(_a = pagination.connAlias) !== null && _a !== void 0 ? _a : pagination.connName];
    }
}
exports.PaginationQueryResult = PaginationQueryResult;
