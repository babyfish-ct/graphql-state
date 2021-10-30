"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRAPHQL_STATE_BEFORE = exports.GRAPHQL_STATE_LAST = exports.GRAPHQL_STATE_AFTER = exports.GRAPHQL_STATE_FIRST = exports.PaginationFetcherProcessor = void 0;
const graphql_ts_client_api_1 = require("graphql-ts-client-api");
class PaginationFetcherProcessor {
    constructor(schema) {
        this.schema = schema;
    }
    process(fetcher, paginationStyle) {
        const [connName, connField] = this.findConnectionField(fetcher);
        return this.adjustConnection(fetcher, connName, connField);
    }
    findConnectionField(fetcher) {
        var _a;
        const fetchableFieldMap = fetcher.fetchableType.fields;
        let connName = undefined;
        let connField = undefined;
        for (const [name, field] of fetcher.fieldMap) {
            const fetchableField = fetchableFieldMap.get(name);
            if ((fetchableField === null || fetchableField === void 0 ? void 0 : fetchableField.category) === "CONNECTION") {
                if (connName !== undefined) {
                    throw new Error(`Cannot parse pagiation query because there are two root connection fields of the fetcher: ` +
                        `"${connName}" and "${name}"`);
                }
                connName = name;
                connField = field;
            }
        }
        if (connName === undefined || connField === undefined) {
            throw new Error(`Cannot parse pagiation query because there are no connection root fields of the fetcher`);
        }
        for (const argName of CONN_ARG_NAMES) {
            if (((_a = connField.argGraphQLTypes) === null || _a === void 0 ? void 0 : _a.has(argName)) !== true) {
                throw new Error(`Cannot parse pagiation query because there is not argument "${argName}" of connection field "${connName}"`);
            }
            if (isArgumentSpecified(connField.args, argName)) {
                throw new Error(`Cannot parse pagiation query, the argument "${argName}" of connection field "${connName}" cannot be specified`);
            }
        }
        return [connName, connField];
    }
    adjustConnection(fetcher, connName, connField) {
        if (connField.childFetchers === undefined) {
            throw new Error(`No child fetcher for connection`);
        }
        for (const childFetcher of connField.childFetchers) {
            for (const name of childFetcher.fieldMap.keys()) {
                if (name.startsWith("...")) {
                    throw new Error("Fragment is forbidden in pageInfo");
                }
            }
        }
        return fetcher[connName](Object.assign(Object.assign({}, connField.args), { first: graphql_ts_client_api_1.ParameterRef.of(exports.GRAPHQL_STATE_FIRST), after: graphql_ts_client_api_1.ParameterRef.of(exports.GRAPHQL_STATE_AFTER), last: graphql_ts_client_api_1.ParameterRef.of(exports.GRAPHQL_STATE_LAST), before: graphql_ts_client_api_1.ParameterRef.of(exports.GRAPHQL_STATE_BEFORE) }), this.adjustPageInfo(connField.childFetchers[0]));
    }
    adjustPageInfo(connFetcher) {
        const pageInfoFetchableField = connFetcher.fetchableType.fields.get("pageInfo");
        if (pageInfoFetchableField === undefined) {
            throw new Error(`No field "pageInfo" declared in "${connFetcher.fetchableType.name}"`);
        }
        if (pageInfoFetchableField.targetTypeName === undefined) {
            throw new Error(`The field "pageInfo" of "${connFetcher.fetchableType.name}" cannot be simple scalar type`);
        }
        const pageInfoFetcher = this.schema.fetcher(pageInfoFetchableField.targetTypeName);
        if (pageInfoFetcher === undefined) {
            throw new Error(`No fetcher for "${pageInfoFetchableField.targetTypeName}" is added into schema`);
        }
        for (const argName of PAGE_ARG_NAMES) {
            if (!pageInfoFetcher.fetchableType.fields.has(argName)) {
                throw new Error(`There is no field "${argName}" declared in "${pageInfoFetchableField.targetTypeName}"`);
            }
            if (pageInfoFetcher.fetchableType.fields.get(argName).isFunction) {
                throw new Error(`The field "${argName}" declared in "${pageInfoFetchableField.targetTypeName}" must be simple field`);
            }
        }
        let pageInfoField = connFetcher.fieldMap.get("pageInfo");
        if (pageInfoField === undefined || pageInfoField.childFetchers === undefined || pageInfoField.childFetchers.length === 0) {
            return connFetcher["pageInfo"](pageInfoFetcher["hasNextPage"]["hasPreviousPage"]["startCursor"]["endCursor"]);
        }
        const pageArgFlags = [false, false, false, false];
        for (const childFetcher of pageInfoField.childFetchers) {
            for (const name of childFetcher.fieldMap.keys()) {
                if (name.startsWith("...")) {
                    throw new Error("Fragment is forbidden in pageInfo");
                }
                const index = PAGE_ARG_NAMES.indexOf(name);
                if (index !== -1) {
                    pageArgFlags[index] = true;
                }
            }
        }
        let existingPageInfoFetcher = pageInfoField.childFetchers[0];
        for (let i = 0; i < PAGE_ARG_NAMES.length; i++) {
            if (!pageArgFlags[i]) {
                existingPageInfoFetcher = existingPageInfoFetcher[PAGE_ARG_NAMES[i]];
            }
        }
        return connFetcher["pageInfo"](existingPageInfoFetcher);
    }
}
exports.PaginationFetcherProcessor = PaginationFetcherProcessor;
exports.GRAPHQL_STATE_FIRST = "graphql_state_first__";
exports.GRAPHQL_STATE_AFTER = "graphql_state_after__";
exports.GRAPHQL_STATE_LAST = "graphql_state_last__";
exports.GRAPHQL_STATE_BEFORE = "graphql_state_before__";
function isArgumentSpecified(args, name) {
    if (args !== undefined) {
        const value = args[name];
        if (value !== undefined) {
            if (value[" $__instanceOfParameterRef"] && value.name === name) {
                return false;
            }
            return true;
        }
    }
    return false;
}
const CONN_ARG_NAMES = ["first", "after", "last", "before"];
const PAGE_ARG_NAMES = ["hasNextPage", "hasPreviousPage", "startCursor", "endCursor"];
