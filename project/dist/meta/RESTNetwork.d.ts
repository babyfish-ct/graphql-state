import { Network } from "..";
import { SchemaMetadata } from "./impl/SchemaMetadata";
import { NetworkBuilder } from "./Network";
import { SchemaType } from "./SchemaType";
export declare class RESTNetworkBuilder<TSchema extends SchemaType> implements NetworkBuilder {
    private _baseUrl;
    private _fetch;
    private _defaultBatchSize;
    private _defaultCollectionBatchSize;
    private _userLoaderMap;
    constructor(_baseUrl: string, _fetch: (url: string) => any);
    defaultBatchSize(batchSize: number): this;
    defaultCollectionBatchSize(batchSize: number): this;
    rootAssociation<TFieldName extends keyof TSchema["query"][" $associationArgs"] & string>(fieldName: TFieldName & string, loader: (url: URLBuilder, args: TSchema["query"][" $associationArgs"][TFieldName]) => void): this;
    rootAssociation<TFieldName extends Exclude<keyof TSchema["query"][" $associationTypes"] & string, keyof TSchema["query"][" $associationTypes"] & string>>(fieldName: TFieldName, loader: (url: URLBuilder) => void): this;
    rootScalar(fieldName: string, loader: (url: URLBuilder, variables: any) => void): this;
    association<TTypeName extends keyof TSchema["entities"], TFieldName extends keyof TSchema["entities"][TTypeName][" $associationArgs"]>(typeName: TTypeName, fieldName: TFieldName, loader: ((url: URLBuilder, id: TSchema["entities"][TTypeName][" $id"], args: TSchema["entities"][TTypeName][" $associationArgs"][TFieldName]) => void) | {
        readonly batchLoader: (url: URLBuilder, ids: ReadonlyArray<TSchema["entities"][TTypeName][" $id"]>, args: TSchema["entities"][TTypeName][" $associationArgs"][TFieldName]) => void;
        readonly batchSize?: number;
        readonly groupBy?: string;
    }): this;
    association<TTypeName extends keyof TSchema["entities"], TFieldName extends keyof Exclude<TSchema["entities"][TTypeName][" $associationTypes"], keyof TSchema["entities"][TTypeName][" $associationArgs"]>>(typeName: TTypeName, fieldName: TFieldName, loader: ((url: URLBuilder, id: TSchema["entities"][TTypeName][" $id"]) => void) | {
        readonly batchLoader: (url: URLBuilder, ids: ReadonlyArray<TSchema["entities"][TTypeName][" $id"]>) => void;
        readonly batchSize?: number;
        readonly groupBy?: string;
    }): this;
    scalar<TTypeName extends keyof TSchema["entities"]>(typeName: TTypeName, fieldName: string, loader: ((id: TSchema["entities"][TTypeName][" $id"]) => void) | {
        batchLoader: (ids: ReadonlyArray<TSchema["entities"][TTypeName][" $id"]>) => void;
        batchSize?: number;
    }): this;
    build(schema: SchemaMetadata): Network;
}
export declare class URLBuilder {
    private url;
    private metArguments;
    constructor(url: string);
    path(text: string): this;
    pathVariable(value: any): this;
    arg(name: string, value: any): this;
    args(variables: any): this;
    toString(): string;
}
