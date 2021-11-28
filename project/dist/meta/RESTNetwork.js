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
exports.URLBuilder = exports.RESTNetworkBuilder = void 0;
const Record_1 = require("../entities/Record");
const Args_1 = require("../state/impl/Args");
class RESTNetworkBuilder {
    constructor(_baseUrl, _fetch) {
        this._baseUrl = _baseUrl;
        this._fetch = _fetch;
        this._defaultBatchSize = 64;
        this._defaultCollectionBatchSize = 8;
        this._userLoaderMap = new Map();
        if (!_baseUrl.startsWith("http://") && !_baseUrl.startsWith("https://")) {
            throw new Error(`baseUrl must start with "http://" or "https://"`);
        }
    }
    defaultBatchSize(batchSize) {
        if (batchSize < 1) {
            throw new Error("batchSize cannot be less than 1");
        }
        this._defaultBatchSize = batchSize;
        return this;
    }
    defaultCollectionBatchSize(batchSize) {
        if (batchSize < 1) {
            throw new Error("batchSize cannot be less than 1");
        }
        this._defaultCollectionBatchSize = batchSize;
        return this;
    }
    rootAssociation(fieldName, loader) {
        this._userLoaderMap.set(`Query.${fieldName}`, { loader });
        return this;
    }
    rootScalar(fieldName, loader) {
        this._userLoaderMap.set(`Query.${fieldName}`, { loader });
        return this;
    }
    association(typeName, fieldName, loader) {
        if (typeof loader === "function") {
            this._userLoaderMap.set(`${typeName}.${fieldName}`, { loader });
        }
        else {
            this._userLoaderMap.set(`${typeName}.${fieldName}`, {
                batchLoader: loader.batchLoader,
                batchSize: loader.batchSize,
                groupBy: loader.groupBy
            });
        }
        return this;
    }
    scalar(typeName, fieldName, loader) {
        if (typeof loader === "function") {
            this._userLoaderMap.set(`${typeName}.${fieldName}`, { loader });
        }
        else {
            this._userLoaderMap.set(`${typeName}.${fieldName}`, {
                batchLoader: loader.batchLoader,
                batchSize: loader.batchSize
            });
        }
        return this;
    }
    build(schema) {
        return new RESTNetwork(schema, this._baseUrl, this._fetch, this._defaultBatchSize, this._defaultCollectionBatchSize, this._userLoaderMap);
    }
}
exports.RESTNetworkBuilder = RESTNetworkBuilder;
class URLBuilder {
    constructor(url) {
        this.url = url;
        this.metArguments = false;
    }
    path(text) {
        if (this.metArguments) {
            throw new Error("Cannot append path after '?'");
        }
        if (text === "" || text === "/") {
            throw new Error("Illegal argument: text cannot be empty or '/'");
        }
        if (text.startsWith("http:") || text.startsWith("https://")) {
            this.url = text;
        }
        if (this.url.endsWith("/") && text.startsWith("/")) {
            this.url += text.substring(1);
        }
        else if (this.url.endsWith("/") || text.startsWith("/")) {
            this.url += text;
        }
        else {
            this.url += '/';
            this.url += text;
        }
        return this;
    }
    pathVariable(value) {
        if (this.metArguments) {
            throw new Error("Cannot append path after '?'");
        }
        const str = encodeURIComponent(`${value}`);
        if (this.url.endsWith("/")) {
            this.url += value;
        }
        else {
            this.url += '/';
            this.url += value;
        }
        return this;
    }
    arg(name, value) {
        if (value === undefined || value === null) {
            return this;
        }
        if (this.metArguments) {
            this.url += '&';
        }
        else {
            this.url += '?';
            this.metArguments = true;
        }
        this.url += name;
        this.url += '=';
        this.url += encodeURIComponent(value);
        return this;
    }
    args(variables) {
        for (const name in variables) {
            const value = variables[name];
            if (value !== undefined && value !== null) {
                this.arg(name, value);
            }
        }
        return this;
    }
    toString() {
        return this.url;
    }
}
exports.URLBuilder = URLBuilder;
class RESTNetwork {
    constructor(schema, baseUrl, fetch, defaultBatchSize, defaultCollectionBatchSize, userLoaderMap) {
        this.schema = schema;
        this.baseUrl = baseUrl;
        this.fetch = fetch;
        this.defaultBatchSize = defaultBatchSize;
        this.defaultCollectionBatchSize = defaultCollectionBatchSize;
        this.userLoaderMap = userLoaderMap;
        for (const key of userLoaderMap.keys()) {
            const index = key.indexOf('.');
            const typeName = key.substring(0, index);
            const fieldName = key.substring(index + 1);
            const type = schema.typeMap.get(typeName);
            if (type === undefined) {
                throw new Error(`Illegal loader configuration for '${key}', illegal type '${typeName}'`);
            }
            const field = type.fieldMap.get(fieldName);
            if (field === undefined) {
                throw new Error(`Illegal loader configuration for '${key}', illegal type '${fieldName}'`);
            }
            if (field.declaringType.name !== typeName) {
                throw new Error(`Illegal loader configuration for '${key}', it should be '${typeName}.${fieldName}'`);
            }
        }
    }
    execute(fetcher, variables) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fetcher.fetchableType.name === "Mutation") {
                throw new Error(`REST Network does not support "useMutation"`);
            }
            const query = {};
            const restLoader = new RESTLoader(this.schema, this.baseUrl, this.fetch, this.defaultBatchSize, this.defaultCollectionBatchSize, this.userLoaderMap, variables);
            restLoader.add(query, fetcher);
            yield restLoader.execute();
            return query;
        });
    }
}
class RESTLoader {
    constructor(schema, baseUrl, fetch, defaultBatchSize, defaultCollectionBatchSize, userLoaderMap, variables) {
        this.schema = schema;
        this.baseUrl = baseUrl;
        this.fetch = fetch;
        this.defaultBatchSize = defaultBatchSize;
        this.defaultCollectionBatchSize = defaultCollectionBatchSize;
        this.userLoaderMap = userLoaderMap;
        this.variables = variables;
        this.dataLoaderMap = new Map();
    }
    add(target, fetcher) {
        var _a, _b, _c;
        const type = this.schema.typeMap.get(fetcher.fetchableType.name);
        if (type === undefined) {
            throw new Error(`Illegal type '${fetcher.fetchableType.name}'`);
        }
        const fetchableType = fetcher.fetchableType;
        const existsNames = new Set(Object.keys(target));
        for (const [name, fetcherField] of fetcher.fieldMap) {
            if (name.startsWith("...")) {
                if (fetcherField.childFetchers !== undefined) {
                    for (const childFetcher of fetcherField.childFetchers) {
                        this.add(target, childFetcher);
                    }
                }
                continue;
            }
            const field = type.fieldMap.get(name);
            if (field === undefined) {
                throw new Error(`Illegal field '${fetcher.fetchableType.name}.${name}'`);
            }
            if (field.category === "ID") {
                continue;
            }
            const alias = (_a = fetcherField.fieldOptionsValue) === null || _a === void 0 ? void 0 : _a.alias;
            if (alias !== undefined && alias !== name && fetchableType.name !== "Query") {
                throw new Error(`In REST query, alias can only be used on field of 'Query' object, but alias is used on '${field.fullName}'`);
            }
            const childFetcher = fetcherField.childFetchers === undefined ? undefined : fetcherField.childFetchers[0];
            const existsValue = target[alias !== null && alias !== void 0 ? alias : name];
            if (existsValue !== undefined) {
                if (childFetcher !== undefined) {
                    this.add(existsValue, childFetcher);
                }
                continue;
            }
            if (existsNames.has(alias !== null && alias !== void 0 ? alias : name)) {
                continue;
            }
            const resolvedArgs = this.resolveArgs(fetcherField);
            const dataLoaderKey = dataLoaderKeyOf(field.declaringType.name, name, alias, resolvedArgs);
            let dataLoader = this.dataLoaderMap.get(dataLoaderKey);
            if (dataLoader === undefined) {
                const userLoader = this.userLoaderMap.get(`${field.declaringType.name}.${name}`);
                if (userLoader === undefined) {
                    throw new Error(`No loader configuration for ${field.declaringType.name}.${name}`);
                }
                dataLoader = {
                    field,
                    fetcherField: fetcherField,
                    resolvedArgs,
                    loaderFn: userLoader.loader,
                    batchLoaderFn: userLoader.batchLoader,
                    batchSize: userLoader.batchSize,
                    groupBy: userLoader.groupBy,
                    objMap: new Map()
                };
                this.dataLoaderMap.set(dataLoaderKey, dataLoader);
            }
            let id;
            if (fetchableType.name === "Query") {
                id = Record_1.QUERY_OBJECT_ID;
            }
            else {
                const idField = type.idField;
                const idFetcherField = fetcher.fieldMap.get(idField.name);
                if (idFetcherField === undefined) {
                    throw new Error(`The id field of "${fetchableType.name}" must be fetched`);
                }
                id = target[(_c = (_b = idFetcherField.fieldOptionsValue) === null || _b === void 0 ? void 0 : _b.alias) !== null && _c !== void 0 ? _c : idField.name];
                if (id === undefined || id === null) {
                    throw new Error(`The id of "${fetchableType.name}" cannot be undefined or null`);
                }
            }
            let arr = dataLoader.objMap.get(id);
            if (arr === undefined) {
                dataLoader.objMap.set(id, arr = []);
            }
            arr.push(target);
        }
    }
    resolveArgs(field) {
        if (field.argGraphQLTypes === undefined || field.argGraphQLTypes.size === 0) {
            return undefined;
        }
        const args = field.args;
        if (args === undefined || args === null) {
            return undefined;
        }
        const resolved = {};
        for (const name of field.argGraphQLTypes.keys()) {
            let value = args[name];
            if (value === undefined || value === null) {
                continue;
            }
            if (value[" $__instanceOfParameterRef"]) {
                value = this.variables === undefined ?
                    undefined :
                    this.variables[value.name];
            }
            if (value === "" && !field.argGraphQLTypes.get(name).endsWith("!")) {
                continue;
            }
            resolved[name] = value;
        }
        return Args_1.VariableArgs.of(resolved);
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            while (true) {
                const dataLoaders = Array.from(this.dataLoaderMap.values());
                if (dataLoaders.length === 0) {
                    break;
                }
                this.dataLoaderMap.clear();
                yield Promise.all(dataLoaders.map(dataLoader => {
                    return dataLoader.batchLoaderFn !== undefined ?
                        this.executeBatchLoader(dataLoader) :
                        this.executeSingleLoader(dataLoader);
                }));
            }
        });
    }
    executeSingleLoader(dataLoader) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(Array.from(dataLoader.objMap.entries()).map(entry => this.fetchOne(entry[0], entry[1], dataLoader)));
        });
    }
    executeBatchLoader(dataLoader) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const batchSize = Math.max(1, (_a = dataLoader.batchSize) !== null && _a !== void 0 ? _a : (dataLoader.field.category === "LIST" || dataLoader.field.category === "CONNECTION" ?
                this.defaultCollectionBatchSize :
                this.defaultBatchSize));
            if (dataLoader.objMap.size <= batchSize) {
                return this.fetchMany(dataLoader.objMap, dataLoader);
            }
            let batchMap = new Map();
            const batchMaps = [];
            for (const [id, objs] of dataLoader.objMap) {
                batchMap.set(id, objs);
                if (batchMap.size === batchSize) {
                    batchMaps.push(batchMap);
                    batchMap = new Map();
                }
            }
            if (batchMap.size !== 0) {
                batchMaps.push(batchMap);
            }
            yield Promise.all(batchMaps.map(batchMap => this.fetchMany(batchMap, dataLoader)));
        });
    }
    fetchOne(id, objects, dataLoader) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let url;
            if (dataLoader.field.declaringType.name === "Query") {
                if (objects.length !== 1) {
                    throw new Error("Internal bug: loader for field of 'Query' must accept one object");
                }
                const urlBuilder = new URLBuilder(this.baseUrl);
                dataLoader.loaderFn(urlBuilder, (_b = (_a = dataLoader.resolvedArgs) === null || _a === void 0 ? void 0 : _a.variables) !== null && _b !== void 0 ? _b : {});
                url = urlBuilder.toString();
            }
            else {
                const urlBuilder = new URLBuilder(this.baseUrl);
                dataLoader.loaderFn(urlBuilder, id, (_d = (_c = dataLoader.resolvedArgs) === null || _c === void 0 ? void 0 : _c.variables) !== null && _d !== void 0 ? _d : {});
                url = urlBuilder.toString();
            }
            const data = replaceNulls(yield this.fetch(url));
            for (const obj of objects) {
                this.saveField(obj, data, dataLoader);
            }
        });
    }
    fetchMany(objMap, dataLoader) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (dataLoader.field.declaringType.name === "Query") {
                throw new Error("Internal bug: batch loader cannot be applied on 'Query'");
            }
            const ids = Array.from(objMap.keys());
            const urlBuilder = new URLBuilder(this.baseUrl);
            dataLoader.batchLoaderFn(urlBuilder, ids, (_b = (_a = dataLoader.resolvedArgs) === null || _a === void 0 ? void 0 : _a.variables) !== null && _b !== void 0 ? _b : {});
            const url = urlBuilder.toString();
            const rawData = replaceNulls(yield this.fetch(url));
            let map;
            if (dataLoader.groupBy !== undefined) {
                if (!Array.isArray(rawData)) {
                    throw new Error(`The batch loader of '${dataLoader.field.fullName}' must return array ` +
                        `because it is configured with groupBy`);
                }
                map = {};
                for (const row of rawData) {
                    const key = row[dataLoader.groupBy];
                    if (key === undefined || key === null) {
                        throw new Error(`The batch loader of '${dataLoader.field.fullName}' must return array ` +
                            `of object with field '${dataLoader.groupBy}'` +
                            `because it is configured with groupBy '${dataLoader.groupBy}'`);
                    }
                    let arr = map[key];
                    if (arr === undefined || arr === null) {
                        map[key] = arr = [];
                    }
                    arr.push(row);
                }
            }
            else {
                if (typeof (rawData) !== 'object' || Array.isArray(rawData)) {
                    throw new Error(`The batch loader of '${dataLoader.field.fullName}' must an object ` +
                        `because it is configured without groupBy`);
                }
                map = rawData;
            }
            for (const [id, objs] of objMap) {
                const data = map[id];
                for (const obj of objs) {
                    this.saveField(obj, data, dataLoader);
                }
            }
        });
    }
    saveField(obj, data, dataLoader) {
        var _a, _b, _c;
        obj[(_c = (_b = (_a = dataLoader.fetcherField) === null || _a === void 0 ? void 0 : _a.fieldOptionsValue) === null || _b === void 0 ? void 0 : _b.alias) !== null && _c !== void 0 ? _c : dataLoader.field.name] = data;
        if (data !== undefined && dataLoader.fetcherField.childFetchers !== undefined) {
            if (dataLoader.field.category === "CONNECTION") {
                const nodeFetcher = dataLoader
                    .fetcherField
                    .childFetchers[0]
                    .findField("edges")
                    .childFetchers[0]
                    .findField("node")
                    .childFetchers[0];
                for (const edge of data.edges) {
                    this.add(edge.node, nodeFetcher);
                }
            }
            else if (dataLoader.field.category === "LIST") {
                for (const element of data) {
                    this.add(element, dataLoader.fetcherField.childFetchers[0]);
                }
            }
            else {
                this.add(data, dataLoader.fetcherField.childFetchers[0]);
            }
        }
    }
}
function dataLoaderKeyOf(typeName, fieldName, fieldAlias, args) {
    if (fieldAlias === undefined) {
        return args === undefined ?
            `${typeName}.${fieldName}` :
            `${typeName}.${fieldName}(${args.key})`;
    }
    return `${typeName}.${fieldName}->${fieldAlias}` ?
        `${typeName}.${fieldName}->${fieldAlias}` :
        `${typeName}.${fieldName}->${fieldAlias}(${args === null || args === void 0 ? void 0 : args.key})`;
}
function replaceNulls(data) {
    if (data === null || data === undefined) {
        return undefined;
    }
    if (Array.isArray(data)) {
        for (let i = data.length - 1; i >= 0; --i) {
            data[i] = replaceNulls(data[i]);
        }
    }
    if (typeof data === "object") {
        for (const field in data) {
            data[field] = replaceNulls(data[field]);
        }
    }
    return data;
}
