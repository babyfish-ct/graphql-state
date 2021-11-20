import { ObjectFetcher, TextWriter } from "graphql-ts-client-api";
import { SchemaType } from "./SchemaType";

export interface Network {

    execute<
        T extends object,
        TVariabes extends object
    >(
        fetcher: ObjectFetcher<'Query' | 'Mutation', T, TVariabes>,
        variables?: TVariabes
    ): Promise<T>;
}

export class GraphQLNetwork {

    constructor(private fetch: (body: string, variables?: object) => Promise<any>) {}

    async execute<
        TData extends object,
        TVariabes extends object
    >(
        fetcher: ObjectFetcher<'Query' | 'Mutation', TData, TVariabes>,
        variables?: TVariabes
    ): Promise<TData> {
        const writer = new TextWriter();
        writer.text(`${fetcher.fetchableType.name.toLowerCase()}`);
        if (fetcher.variableTypeMap.size !== 0) {
            writer.scope({type: "ARGUMENTS", multiLines: fetcher.variableTypeMap.size > 2, suffix: " "}, () => {
                for (const [name, type] of fetcher.variableTypeMap) {
                    writer.seperator();
                    writer.text(`$${name}: ${type}`);
                }
            });
        }
        writer.text(fetcher.toString());
        writer.text(fetcher.toFragmentString());

        const response = await this.fetch(writer.toString(), variables ?? {});
        if (response.errors) {
            throw new Error(response.errors);
        }
        return response.data as TData;
    }
}

export class RESTNetworkBuilder<TSchema extends SchemaType> {

    private _baseUrl?: string;

    private _dataLoaderMap = new Map<string, Function>();

    baseUrl(url: string): this {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            throw new Error(`baseUrl must start with "http://" or "https://"`);
        }
        this._baseUrl = url;
        return this;
    }

    rootAssociation<
        TFieldName extends keyof TSchema["query"][" $associationArgs"] & string
    >(
        fieldName: TFieldName & string,
        endpoint: (args: TSchema["query"][" $associationArgs"][TFieldName]) => string
    ): this;

    rootAssociation<
        TFieldName extends Exclude<
            keyof TSchema["query"][" $associationTypes"] & string,
            keyof TSchema["query"][" $associationTypes"] & string
        >
    >(
        fieldName: TFieldName,
        endpoint: string | (() => string)
    ): this;

    rootAssociation(
        fieldName: string,
        endpoint: string | Function
    ): this {
        return this;
    }

    rootScalar(
        fieldName: string, 
        endpoint: (variables: any) => string
    ): this {
        this._dataLoaderMap.set(`Query.${fieldName}`, endpoint);
        return this;
    }

    association<
        TTypeName extends keyof TSchema["entities"],
        TFieldName extends keyof TSchema["entities"][TTypeName][" $associationArgs"]
    >(
        typeName: TTypeName,
        fieldName: TFieldName,
        endpoint: (
            ids: ReadonlyArray<TSchema["entities"][TTypeName][" $id"]>,
            args: TSchema["entities"][TTypeName][" $associationArgs"][TFieldName]
        ) => string
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
        endpoint: (
            ids: ReadonlyArray<TSchema["entities"][TTypeName][" $id"]>
        ) => string
    ): this;

    association(
        typeName: string,
        fieldName: string,
        endpoint: Function
    ): this {
        this._dataLoaderMap.set(`${typeName}.${fieldName}`, endpoint);
        return this;
    }

    scalar<
        TTypeName extends keyof TSchema["entities"]
    >(
        typeName: TTypeName,
        fieldName: string,
        endpoint: (is: ReadonlyArray<TSchema["entities"][TTypeName][" $id"]>) => string
    ): this {
        this._dataLoaderMap.set(`${typeName}.${fieldName}`, endpoint);
        return this;
    }

    build(): Network {
        return new RESTNetwork(this._baseUrl, this._dataLoaderMap);
    }
}

class RESTNetwork implements Network {

    constructor(
        private _baseUrl: string | undefined,
        private _dataLoaderMap: Map<string, Function>
    ) {

    }

    async execute<
        T extends object,
        TVariabes extends object
    >(
        fetcher: ObjectFetcher<'Query' | 'Mutation', T, TVariabes>,
        variables?: TVariabes
    ): Promise<T> {
        if (fetcher.fetchableType.name === "Mutation") {
            throw new Error(`REST Network does not support "useMutation"`);
        }
        const obj: object = {};
        await this.load(obj, fetcher, variables);
        return obj as T;
    }

    private async load(
        obj: object,
        fetcher: ObjectFetcher<any, any, any>,
        variables: any
    ) {
        for (const [name, field] of fetcher.fieldMap) {
            if (name.startsWith("...")) {
                
            }
        }
    }

    private unloadedFields(
        obj: object,
        fetcher: ObjectFetcher<any, any, any>
    ) {
        
    }
}

class RestLoader {

    private unresolvedObjects: object;

    
}