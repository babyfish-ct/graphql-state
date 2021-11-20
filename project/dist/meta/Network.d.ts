import { ObjectFetcher } from "graphql-ts-client-api";
import { SchemaType } from "./SchemaType";
export interface Network {
    execute<T extends object, TVariabes extends object>(fetcher: ObjectFetcher<'Query' | 'Mutation', T, TVariabes>, variables?: TVariabes): Promise<T>;
}
export declare class GraphQLNetwork {
    private fetch;
    constructor(fetch: (body: string, variables?: object) => Promise<any>);
    execute<TData extends object, TVariabes extends object>(fetcher: ObjectFetcher<'Query' | 'Mutation', TData, TVariabes>, variables?: TVariabes): Promise<TData>;
}
export declare class RESTNetworkBuilder<TSchema extends SchemaType> {
    private _baseUrl?;
    private _dataLoaderMap;
    baseUrl(url: string): this;
    rootAssociation<TFieldName extends keyof TSchema["query"][" $associationArgs"] & string>(fieldName: TFieldName & string, endpoint: (args: TSchema["query"][" $associationArgs"][TFieldName]) => string): this;
    rootAssociation<TFieldName extends Exclude<keyof TSchema["query"][" $associationTypes"] & string, keyof TSchema["query"][" $associationTypes"] & string>>(fieldName: TFieldName, endpoint: string | (() => string)): this;
    rootScalar(fieldName: string, endpoint: (variables: any) => string): this;
    association<TTypeName extends keyof TSchema["entities"], TFieldName extends keyof TSchema["entities"][TTypeName][" $associationArgs"]>(typeName: TTypeName, fieldName: TFieldName, endpoint: (ids: ReadonlyArray<TSchema["entities"][TTypeName][" $id"]>, args: TSchema["entities"][TTypeName][" $associationArgs"][TFieldName]) => string): this;
    association<TTypeName extends keyof TSchema["entities"], TFieldName extends keyof Exclude<TSchema["entities"][TTypeName][" $associationTypes"], keyof TSchema["entities"][TTypeName][" $associationArgs"]>>(typeName: TTypeName, fieldName: TFieldName, endpoint: (ids: ReadonlyArray<TSchema["entities"][TTypeName][" $id"]>) => string): this;
    scalar<TTypeName extends keyof TSchema["entities"]>(typeName: TTypeName, fieldName: string, endpoint: (is: ReadonlyArray<TSchema["entities"][TTypeName][" $id"]>) => string): this;
    build(): Network;
}
