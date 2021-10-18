import { ObjectFetcher } from "graphql-ts-client-api";
import { StateManager } from "../state/StateManager";
import { SchemaType } from "./SchemaType";
export interface Configuration<TSchema extends SchemaType> {
    associationProperties<TTypeName extends keyof TSchema["entities"] & string, TFieldName extends keyof TSchema["entities"][TTypeName][" $associationArgs"] & string>(typeName: TTypeName, fieldName: TFieldName, properties: {
        readonly contains: (row: ScalarRow<TSchema["entities"][TTypeName][" $scalarTypes"]>, variables: TSchema["entities"][TTypeName][" $associationArgs"][TFieldName]) => boolean | undefined;
        readonly position?: (row: ScalarRow<TSchema["entities"][TTypeName][" $scalarTypes"]>, rows: ReadonlyArray<ScalarRow<TSchema["entities"][TTypeName][" $scalarTypes"]>>, variables: TSchema["entities"][TTypeName][" $associationArgs"][TFieldName]) => PositionType | undefined;
        readonly dependencies: (variables: TSchema["entities"][TTypeName][" $associationArgs"][TFieldName]) => ReadonlyArray<keyof TSchema["entities"][TTypeName][" $scalarTypes"]> | undefined;
    }): this;
    associationProperties<TTypeName extends keyof TSchema["entities"] & string, TFieldName extends keyof Exclude<TSchema["entities"][TTypeName][" $associationTypes"], keyof TSchema["entities"][TTypeName][" $associationArgs"]> & string>(typeName: TTypeName, fieldName: TFieldName, properties: {
        readonly contains?: (row: ScalarRow<TSchema["entities"][TTypeName][" $scalarTypes"]>) => boolean | undefined;
        readonly position?: (row: ScalarRow<TSchema["entities"][TTypeName][" $scalarTypes"]>, rows: ReadonlyArray<ScalarRow<TSchema["entities"][TTypeName][" $scalarTypes"]>>) => PositionType | undefined;
        readonly dependencies?: () => ReadonlyArray<keyof TSchema["entities"][TTypeName][" $scalarTypes"]> | undefined;
    }): this;
    bidirectionalAssociation<TTypeName extends keyof TSchema["entities"] & string, TFieldName extends keyof TSchema["entities"][TTypeName][" $associationTypes"] & string, TOppositeFieldName extends keyof TSchema["entities"][TSchema["entities"][TTypeName][" $associationTypes"][TFieldName]][" $associationTypes"] & string>(typeName: TTypeName, fieldName: TFieldName, oppositeFieldName: TOppositeFieldName): this;
    network(network: Network): this;
    buildStateManager(): StateManager<TSchema>;
}
export interface ScalarRow<TScalarType extends {
    readonly [key: string]: any;
}> {
    has(fieldName: keyof TScalarType): boolean;
    get<TFieldName extends keyof TScalarType & string>(fieldName: TFieldName): TScalarType[TFieldName];
}
export declare type PositionType = number | "start" | "end";
export interface Network {
    execute<T extends object, TVariabes extends object>(fetcher: ObjectFetcher<'Query' | 'Mutation', T, TVariabes>, variables?: TVariabes): Promise<T>;
}
export declare class GraphQLNetwork {
    private fetch;
    constructor(fetch: (body: string, variables?: object) => Promise<any>);
    execute<TData extends object, TVariabes extends object>(fetcher: ObjectFetcher<'Query' | 'Mutation', TData, TVariabes>, variables?: TVariabes): Promise<TData>;
}
