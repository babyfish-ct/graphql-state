import { Fetcher, FetcherField, ObjectFetcher, ParameterRef } from "graphql-ts-client-api";
import { Network } from "..";
import { QUERY_OBJECT_ID } from "../entities/Record";
import { VariableArgs } from "../state/impl/Args";
import { FieldMetadata } from "./impl/FieldMetadata";
import { SchemaMetadata } from "./impl/SchemaMetadata";
import { NetworkBuilder } from "./Network";
import { SchemaType } from "./SchemaType";

export class RESTNetworkBuilder<TSchema extends SchemaType> implements NetworkBuilder {

    private _defaultBatchSize = 64;

    private _defaultCollectionBatchSize = 8;

    private _userLoaderMap = new Map<string, UserLoader>();

    constructor(private _baseUrl: string, private _fetch: (url: string) => any) {
        if (!_baseUrl.startsWith("http://") && !_baseUrl.startsWith("https://")) {
            throw new Error(`baseUrl must start with "http://" or "https://"`);
        }
    }

    defaultBatchSize(batchSize: number): this {
        if (batchSize < 1) {
            throw new Error("batchSize cannot be less than 1");
        }
        this._defaultBatchSize = batchSize;
        return this;
    }

    defaultCollectionBatchSize(batchSize: number): this {
        if (batchSize < 1) {
            throw new Error("batchSize cannot be less than 1");
        }
        this._defaultCollectionBatchSize = batchSize;
        return this;
    }

    rootAssociation<
        TFieldName extends keyof TSchema["query"][" $associationArgs"] & string
    >(
        fieldName: TFieldName & string,
        loader: (url: URLBuilder, args: TSchema["query"][" $associationArgs"][TFieldName]) => void,
    ): this;

    rootAssociation<
        TFieldName extends Exclude<
            keyof TSchema["query"][" $associationTypes"] & string,
            keyof TSchema["query"][" $associationTypes"] & string
        >
    >(
        fieldName: TFieldName,
        loader: (url: URLBuilder) => void
    ): this;

    rootAssociation(
        fieldName: string,
        loader: Function
    ): this {
        this._userLoaderMap.set(`Query.${fieldName}`, { loader });
        return this;
    }

    rootScalar(
        fieldName: string, 
        loader: (url: URLBuilder, variables: any) => void
    ): this {
        this._userLoaderMap.set(`Query.${fieldName}`, { loader });
        return this;
    }

    association<
        TTypeName extends keyof TSchema["entities"],
        TFieldName extends keyof TSchema["entities"][TTypeName][" $associationArgs"]
    >(
        typeName: TTypeName,
        fieldName: TFieldName,
        loader: (
            (
                url: URLBuilder, 
                id: TSchema["entities"][TTypeName][" $id"],
                args: TSchema["entities"][TTypeName][" $associationArgs"][TFieldName]
            ) => void
        ) | {
            readonly batchLoader: (
                url: URLBuilder, 
                ids: ReadonlyArray<TSchema["entities"][TTypeName][" $id"]>,
                args: TSchema["entities"][TTypeName][" $associationArgs"][TFieldName]
            ) => void;
            readonly batchSize?: number;
            readonly groupBy?: string;
        }
    ): this;

    association<
        TTypeName extends keyof TSchema["entities"],
        TFieldName extends keyof Exclude<
            TSchema["entities"][TTypeName][" $associationTypes"], 
            keyof TSchema["entities"][TTypeName][" $associationArgs"]
        >
    >(
        typeName: TTypeName,
        fieldName: TFieldName,
        loader: (
            (
                url: URLBuilder, 
                id: TSchema["entities"][TTypeName][" $id"]
            ) => void
        ) | {
            readonly batchLoader: (
                url: URLBuilder, 
                ids: ReadonlyArray<TSchema["entities"][TTypeName][" $id"]>
            ) => void;
            readonly batchSize?: number;
            readonly groupBy?: string;
        }
    ): this;

    association(
        typeName: string,
        fieldName: string,
        loader: Function | { 
            readonly batchLoader: Function;
            readonly batchSize?: number;
            readonly groupBy?: string;
        }
    ): this {
        if (typeof loader === "function") {
            this._userLoaderMap.set(`${typeName}.${fieldName}`, { loader });
        } else {
            this._userLoaderMap.set(`${typeName}.${fieldName}`, { 
                batchLoader: loader.batchLoader, 
                batchSize: loader.batchSize,
                groupBy: loader.groupBy
            });
        }
        return this;
    }

    scalar<
        TTypeName extends keyof TSchema["entities"]
    >(
        typeName: TTypeName,
        fieldName: string,
        loader: (
            (id: TSchema["entities"][TTypeName][" $id"]) => void
        ) | {
            batchLoader: (ids: ReadonlyArray<TSchema["entities"][TTypeName][" $id"]>) => void,
            batchSize?: number
        }
    ): this {
        if (typeof loader === "function") {
            this._userLoaderMap.set(`${typeName.toString()}.${fieldName.toString()}`, { loader });
        } else {
            this._userLoaderMap.set(`${typeName.toString()}.${fieldName.toString()}`, { 
                batchLoader: loader.batchLoader,
                batchSize: loader.batchSize
            });
        }
        return this;
    }

    build(schema: SchemaMetadata): Network {
        return new RESTNetwork(
            schema, 
            this._baseUrl, 
            this._fetch, 
            this._defaultBatchSize, 
            this._defaultCollectionBatchSize, 
            this._userLoaderMap
        );
    }
}

export class URLBuilder {

    private metArguments = false;

    constructor(private url: string) {}

    path(text: string): this {
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
        } else if (this.url.endsWith("/") || text.startsWith("/")) {
            this.url += text;
        } else {
            this.url += '/';
            this.url += text;
        }
        return this;
    }

    pathVariable(value: any): this {
        if (this.metArguments) {
            throw new Error("Cannot append path after '?'");
        }
        const str = encodeURIComponent(`${value}`);
        if (this.url.endsWith("/")) {
            this.url += value;
        } else {
            this.url += '/';
            this.url += value;
        }
        return this;
    }

    arg(name: string, value: any): this {
        if (value === undefined || value === null) {
            return this;
        }
        if (this.metArguments) {
            this.url += '&';
        } else {
            this.url += '?';
            this.metArguments = true;
        }
        this.url += name;
        this.url += '=';
        this.url += encodeURIComponent(value);
        return this;
    }

    args(variables: any): this {
        for (const name in variables) {
            const value = variables[name];
            if (value !== undefined && value !== null) {
                this.arg(name, value);
            }
        }
        return this;
    }

    toString(): string {
        return this.url;
    }
}

class RESTNetwork implements Network {

    constructor(
        private schema: SchemaMetadata,
        private baseUrl: string,
        private fetch: (url: string) => any,
        private defaultBatchSize: number,
        private defaultCollectionBatchSize: number,
        private userLoaderMap: Map<string, UserLoader>
    ) {
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

    async execute<
        T extends object,
        TVariabes extends object
    >(
        fetcher: ObjectFetcher<'Query', T, TVariabes>,
        variables?: TVariabes
    ): Promise<T> {
        if (fetcher.fetchableType.name as any === "Mutation") {
            throw new Error(`REST Network does not support "useMutation"`);
        }
        const query = {};
        const restLoader = new RESTLoader(
            this.schema,
            this.baseUrl,
            this.fetch,
            this.defaultBatchSize,
            this.defaultCollectionBatchSize,
            this.userLoaderMap,
            variables
        );
        restLoader.add(query, fetcher);
        await restLoader.execute();
        return query as T;
    }
}

class RESTLoader {

    private dataLoaderMap = new Map<string, DataLoader>();

    constructor(
        private schema: SchemaMetadata,
        private baseUrl: string,
        private fetch: (url: string) => any,
        private defaultBatchSize: number,
        private defaultCollectionBatchSize: number,
        private userLoaderMap: Map<string, UserLoader>,
        private variables: any
    ) {
        
    }

    add(
        target: object,
        fetcher: Fetcher<string, any, any>
    ) {
        const type = this.schema.typeMap.get(fetcher.fetchableType.name);
        if (type === undefined) {
            throw new Error(`Illegal type '${fetcher.fetchableType.name}'`);
        }
        const fetchableType = fetcher.fetchableType;
        const existsNames = new Set<string>(Object.keys(target));
        for (const fetcherField of fetcher.fieldMap.values()) {
            const fetcherFieldName = fetcherField.name;
            if (fetcherField.name.startsWith("...")) {
                if (fetcherField.childFetchers !== undefined) {
                    for (const childFetcher of fetcherField.childFetchers) {
                        this.add(target, childFetcher);
                    }
                }
                continue;
            }
            const field = type.fieldMap.get(fetcherFieldName);
            if (field === undefined) {
                throw new Error(`Illegal field '${fetcher.fetchableType.name}.${fetcherFieldName}'`);
            }
            if (field.category === "ID") {
                continue;
            }
            const alias = fetcherField.fieldOptionsValue?.alias;
            if (alias !== undefined && alias !== fetcherFieldName && fetchableType.name !== "Query") {
                throw new Error(`In REST query, alias can only be used on field of 'Query' object, but alias is used on '${field.fullName}'`);
            }
            const childFetcher = fetcherField.childFetchers === undefined ? undefined : fetcherField.childFetchers[0];
            const existsValue = target[alias ?? fetcherFieldName]; 
            if (existsValue !== undefined) {
                if (childFetcher !== undefined) {
                    this.add(existsValue, childFetcher);
                }
                continue;
            }
            if (existsNames.has(alias ?? fetcherFieldName)) {
                continue;
            }
            const resolvedArgs = this.resolveArgs(fetcherField);
            const dataLoaderKey = dataLoaderKeyOf(
                field.declaringType.name, 
                fetcherFieldName, 
                alias,
                resolvedArgs
            );
            let dataLoader = this.dataLoaderMap.get(dataLoaderKey);
            if (dataLoader === undefined) {
                const userLoader = this.userLoaderMap.get(`${field.declaringType.name}.${field.name}`);
                if (userLoader === undefined) {
                    throw new Error(`No loader configuration for ${field.declaringType.name}.${field.name}`);
                }
                dataLoader = {
                    field,
                    fetcherField: fetcherField,
                    resolvedArgs,
                    loaderFn: userLoader.loader,
                    batchLoaderFn: userLoader.batchLoader,
                    batchSize: userLoader.batchSize,
                    groupBy: userLoader.groupBy,
                    objMap: new Map<any, object[]>()
                }
                this.dataLoaderMap.set(dataLoaderKey, dataLoader);
            }
            let id: any;
            if (fetchableType.name === "Query") {
                id = QUERY_OBJECT_ID;
            } else {
                const idField = type.idField;
                const idFetcherField = fetcher.findFieldByName(idField.name);
                if (idFetcherField === undefined) {
                    throw new Error(`The id field of "${fetchableType.name}" must be fetched`);
                }
                id = target[idFetcherField.fieldOptionsValue?.alias ?? idField.name];
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

    private resolveArgs(field: FetcherField): VariableArgs | undefined {
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
                    this.variables[(value as ParameterRef<any>).name];
            }
            if (value === "" && !field.argGraphQLTypes.get(name)!.endsWith("!")) {
                continue;
            }
            resolved[name] = value;
        }
        return VariableArgs.of(resolved);
    }

    async execute(): Promise<void> {
        while (true) {
            const dataLoaders = Array.from(this.dataLoaderMap.values());
            if (dataLoaders.length === 0) {
                break;
            }
            this.dataLoaderMap.clear();
            await Promise.all(
                dataLoaders.map(
                    dataLoader => {
                        return dataLoader.batchLoaderFn !== undefined ?
                        this.executeBatchLoader(dataLoader) :
                        this.executeSingleLoader(dataLoader)
                    }
                )    
            );
        }
    }

    private async executeSingleLoader(dataLoader: DataLoader): Promise<void> {
        await Promise.all(
            Array.from(dataLoader.objMap.entries()).map(entry =>
                this.fetchOne(entry[0], entry[1], dataLoader)           
            )
        );
    }

    private async executeBatchLoader(dataLoader: DataLoader): Promise<void> {
        const batchSize = Math.max(
            1, 
            dataLoader.batchSize ?? (
                dataLoader.field.category === "LIST" || dataLoader.field.category === "CONNECTION" ?
                this.defaultCollectionBatchSize :
                this.defaultBatchSize
            )
        );
        if (dataLoader.objMap.size <= batchSize) {
            return this.fetchMany(
                dataLoader.objMap,
                dataLoader
            );
        }
        let batchMap = new Map<any, object[]>();
        const batchMaps: Map<any, object[]>[] = [];
        for (const [id, objs] of dataLoader.objMap) {
            batchMap.set(id, objs);
            if (batchMap.size === batchSize) {
                batchMaps.push(batchMap);
                batchMap = new Map<any, object[]>();
            }
        }
        if (batchMap.size !== 0) {
            batchMaps.push(batchMap);
        }
        await Promise.all(
            batchMaps.map(
                batchMap => this.fetchMany(batchMap, dataLoader)
            )
        );
    }

    private async fetchOne(
        id: any, 
        objects: object[], 
        dataLoader: DataLoader
    ): Promise<void> {
        let url: string;
        if (dataLoader.field.declaringType.name === "Query") {
            if (objects.length !== 1) {
                throw new Error("Internal bug: loader for field of 'Query' must accept one object")
            }
            const urlBuilder = new URLBuilder(this.baseUrl);
            dataLoader.loaderFn!(urlBuilder, dataLoader.resolvedArgs?.variables ?? {});
            url = urlBuilder.toString();
        } else {
            const urlBuilder = new URLBuilder(this.baseUrl);
            dataLoader.loaderFn!(urlBuilder, id, dataLoader.resolvedArgs?.variables ?? {});
            url = urlBuilder.toString();
        }
        const data = replaceNulls(await this.fetch(url));
        for (const obj of objects) {
            this.saveField(obj, data, dataLoader);
        }
    }

    private async fetchMany(
        objMap: Map<any, object[]>,
        dataLoader: DataLoader
    ): Promise<void> {
        if (dataLoader.field.declaringType.name === "Query") {
            throw new Error("Internal bug: batch loader cannot be applied on 'Query'");    
        }
        const ids = Array.from(objMap.keys());
        const urlBuilder = new URLBuilder(this.baseUrl);
        dataLoader.batchLoaderFn!(urlBuilder, ids, dataLoader.resolvedArgs?.variables ?? {});
        const url = urlBuilder.toString();
        const rawData = replaceNulls(await this.fetch(url));
        let map: object;
        if (dataLoader.groupBy !== undefined) {
            if (!Array.isArray(rawData)) {
                throw new Error(
                    `The batch loader of '${dataLoader.field.fullName}' must return array ` +
                    `because it is configured with groupBy`
                );
            }
            map = {};
            for (const row of rawData) {
                const key = row[dataLoader.groupBy];
                if (key === undefined || key === null) {
                    throw new Error(
                        `The batch loader of '${dataLoader.field.fullName}' must return array ` +
                        `of object with field '${dataLoader.groupBy}'` +
                        `because it is configured with groupBy '${dataLoader.groupBy}'`
                    );
                }
                let arr = map[key];
                if (arr === undefined || arr === null) {
                    map[key] = arr = [];
                }
                arr.push(row);
            }
        } else {
            if (typeof(rawData) !== 'object' || Array.isArray(rawData)) {
                throw new Error(
                    `The batch loader of '${dataLoader.field.fullName}' must an object ` +
                    `because it is configured without groupBy`
                );
            }
            map = rawData;
        }
        for (const [id, objs] of objMap) {
            const data = map[id];
            for (const obj of objs) {
                this.saveField(obj, data, dataLoader);
            }
        }
    }

    private saveField(obj: object, data: any, dataLoader: DataLoader) {
        obj[dataLoader.fetcherField?.fieldOptionsValue?.alias ?? dataLoader.field.name] = data;
        if (data !== undefined && dataLoader.fetcherField.childFetchers !== undefined) {
            if (dataLoader.field.category === "CONNECTION") {
                const nodeFetcher = dataLoader
                    .fetcherField
                    .childFetchers![0]
                    .findField("edges")!
                    .childFetchers![0]
                    .findField("node")!
                    .childFetchers![0];
                for (const edge of data.edges) {
                    this.add(edge.node, nodeFetcher);
                }
            } else if (dataLoader.field.category === "LIST") {
                for (const element of data) {
                    this.add(element, dataLoader.fetcherField.childFetchers[0]);
                }
            } else {
                this.add(data, dataLoader.fetcherField.childFetchers[0]);
            }
        }
    }
}

interface UserLoader {
    readonly loader?: Function;
    readonly batchLoader?: Function;
    readonly batchSize?: number;
    readonly groupBy?: string;
}

interface DataLoader {
    readonly field: FieldMetadata;
    readonly fetcherField: FetcherField;
    readonly resolvedArgs?: VariableArgs;
    readonly loaderFn?: Function;
    readonly batchLoaderFn?: Function;
    readonly batchSize?: number;
    readonly groupBy?: string;
    readonly objMap: Map<any, object[]>;
}

function dataLoaderKeyOf(
    typeName: string, 
    fieldName: string, 
    fieldAlias: string | undefined,
    args: VariableArgs | undefined
): string {
    if (fieldAlias === undefined) {
        return args === undefined ? 
            `${typeName}.${fieldName}` :
            `${typeName}.${fieldName}(${args.key})`;
    }
    return `${typeName}.${fieldName}->${fieldAlias}` ?
        `${typeName}.${fieldName}->${fieldAlias}` :
        `${typeName}.${fieldName}->${fieldAlias}(${args?.key})`;
}

function replaceNulls(data: any): any {
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
