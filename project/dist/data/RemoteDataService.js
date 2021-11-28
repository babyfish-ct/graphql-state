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
exports.RemoteDataService = void 0;
const graphql_ts_client_api_1 = require("graphql-ts-client-api");
const PaginationFetcherProcessor_1 = require("../entities/PaginationFetcherProcessor");
const AbstractDataRequest_1 = require("./AbstractDataRequest");
const AbstractDataService_1 = require("./AbstractDataService");
class RemoteDataService extends AbstractDataService_1.AbstractDataService {
    constructor(entityManager) {
        super(entityManager);
        this.pendingRequestMap = new Map();
        const queryFetcher = entityManager.schema.fetcher("Query");
        if (queryFetcher !== undefined) {
            const entitiesField = queryFetcher.fetchableType.fields.get("entities");
            if (entitiesField !== undefined) {
                if (entitiesField.category !== "LIST") {
                    throw new Error(`"Query.entities" must returns list`);
                }
                const nodeFetcher = this.entityManager.schema.fetcher(entitiesField.targetTypeName);
                if (nodeFetcher === undefined) {
                    throw new Error(`Internal bug: No fetcher for the returned type of "Query.entities"`);
                }
                if (entitiesField.argGraphQLTypeMap.size !== 2) {
                    throw new Error(`"Query.entities" should contains 2 arguments named "typeName" and "ids"`);
                }
                const typeNameType = entitiesField.argGraphQLTypeMap.get("typeName");
                const idsType = entitiesField.argGraphQLTypeMap.get("ids");
                if (typeNameType === undefined || idsType === undefined) {
                    throw new Error(`"Query.entities" should contains 2 arguments named "typeName" and "ids"`);
                }
                if (typeNameType !== "String!") {
                    throw new Error(`The type of the argument "typeName" of "Query.entities" must be "String!"`);
                }
                if (!idsType.endsWith("!]!")) {
                    throw new Error(`The type of the argument "ids" of "Query.entities" must be non-null list with non-null elements`);
                }
                this.objectFetcherCreator = (fetcher) => {
                    return queryFetcher.entities(nodeFetcher.on(fetcher));
                };
            }
        }
    }
    query(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let pendingRequest = undefined;
            for (const [, request] of this.pendingRequestMap) {
                if (request.args.contains(args)) {
                    pendingRequest = request;
                    break;
                }
            }
            if (pendingRequest === undefined) {
                pendingRequest = new PendingRequest(this, args);
                this.pendingRequestMap.set(args.key, pendingRequest);
                pendingRequest.execute();
            }
            return pendingRequest.newPromise(args);
        });
    }
    onExecute(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = graphql_ts_client_api_1.util.exceptNullValues(yield this.executeNetworkQuery(args));
            if (args.pagination !== undefined) {
                const savingArgs = args
                    .withPaginationInfo()
                    .variables(SAVING_PAGINATION_ARGS);
                this.entityManager.save(savingArgs.shape, data, args.pagination);
            }
            else {
                this.entityManager.save(args.shape, data);
            }
            return data;
        });
    }
    onComplete(args) {
        this.pendingRequestMap.delete(args.key);
    }
    executeNetworkQuery(args) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const network = this.entityManager.stateManager.network;
            if (network === undefined) {
                throw new Error(`Cannot execute remote data loading because network is not configured`);
            }
            if (args.ids === undefined) {
                return yield network.execute(args.fetcher, (_b = (_a = args.optionArgs) === null || _a === void 0 ? void 0 : _a.variableArgs) === null || _b === void 0 ? void 0 : _b.variables);
            }
            if (this.objectFetcherCreator === undefined) {
                throw new Error(`The object(s) query is not supported because there is no field "Query.entities"`);
            }
            const data = yield network.execute(this.objectFetcherCreator(args.fetcher), Object.assign(Object.assign({}, (_c = args.optionArgs) === null || _c === void 0 ? void 0 : _c.variableArgs), { typeName: args.fetcher.fetchableType.name, ids: args.ids }));
            return data.entities;
        });
    }
}
exports.RemoteDataService = RemoteDataService;
class PendingRequest extends AbstractDataRequest_1.AbstractDataRequest {
}
const SAVING_PAGINATION_ARGS = {
    [PaginationFetcherProcessor_1.GRAPHQL_STATE_FIRST]: undefined,
    [PaginationFetcherProcessor_1.GRAPHQL_STATE_AFTER]: undefined,
    [PaginationFetcherProcessor_1.GRAPHQL_STATE_LAST]: undefined,
    [PaginationFetcherProcessor_1.GRAPHQL_STATE_BEFORE]: undefined
};
