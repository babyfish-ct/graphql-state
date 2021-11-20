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
exports.RESTNetworkBuilder = exports.GraphQLNetwork = void 0;
const graphql_ts_client_api_1 = require("graphql-ts-client-api");
class GraphQLNetwork {
    constructor(fetch) {
        this.fetch = fetch;
    }
    execute(fetcher, variables) {
        return __awaiter(this, void 0, void 0, function* () {
            const writer = new graphql_ts_client_api_1.TextWriter();
            writer.text(`${fetcher.fetchableType.name.toLowerCase()}`);
            if (fetcher.variableTypeMap.size !== 0) {
                writer.scope({ type: "ARGUMENTS", multiLines: fetcher.variableTypeMap.size > 2, suffix: " " }, () => {
                    for (const [name, type] of fetcher.variableTypeMap) {
                        writer.seperator();
                        writer.text(`$${name}: ${type}`);
                    }
                });
            }
            writer.text(fetcher.toString());
            writer.text(fetcher.toFragmentString());
            const response = yield this.fetch(writer.toString(), variables !== null && variables !== void 0 ? variables : {});
            if (response.errors) {
                throw new Error(response.errors);
            }
            return response.data;
        });
    }
}
exports.GraphQLNetwork = GraphQLNetwork;
class RESTNetworkBuilder {
    constructor() {
        this._dataLoaderMap = new Map();
    }
    baseUrl(url) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            throw new Error(`baseUrl must start with "http://" or "https://"`);
        }
        this._baseUrl = url;
        return this;
    }
    rootAssociation(fieldName, endpoint) {
        return this;
    }
    rootScalar(fieldName, endpoint) {
        this._dataLoaderMap.set(`Query.${fieldName}`, endpoint);
        return this;
    }
    association(typeName, fieldName, endpoint) {
        this._dataLoaderMap.set(`${typeName}.${fieldName}`, endpoint);
        return this;
    }
    scalar(typeName, fieldName, endpoint) {
        this._dataLoaderMap.set(`${typeName}.${fieldName}`, endpoint);
        return this;
    }
    build() {
        return new RESTNetwork(this._baseUrl, this._dataLoaderMap);
    }
}
exports.RESTNetworkBuilder = RESTNetworkBuilder;
class RESTNetwork {
    constructor(_baseUrl, _dataLoaderMap) {
        this._baseUrl = _baseUrl;
        this._dataLoaderMap = _dataLoaderMap;
    }
    execute(fetcher, variables) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fetcher.fetchableType.name === "Mutation") {
                throw new Error(`REST Network does not support "useMutation"`);
            }
            const obj = {};
            yield this.load(obj, fetcher, variables);
            return obj;
        });
    }
    load(obj, fetcher, variables) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const [name, field] of fetcher.fieldMap) {
                if (name.startsWith("...")) {
                }
            }
        });
    }
    unloadedFields(obj, fetcher) {
    }
}
