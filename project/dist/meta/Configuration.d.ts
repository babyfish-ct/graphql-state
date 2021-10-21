import { ObjectFetcher } from "graphql-ts-client-api";
import { StateManager } from "../state/StateManager";
import { SchemaType } from "./SchemaType";
export interface Configuration<TSchema extends SchemaType> {
    bidirectionalAssociation<TTypeName extends keyof TSchema["entities"] & string, TFieldName extends keyof TSchema["entities"][TTypeName][" $associationTypes"] & string, TOppositeFieldName extends keyof TSchema["entities"][TSchema["entities"][TTypeName][" $associationTypes"][TFieldName]][" $associationTypes"] & string>(typeName: TTypeName, fieldName: TFieldName, oppositeFieldName: TOppositeFieldName): this;
    rootAssociationProperties<TFieldName extends keyof TSchema["query"][" $associationArgs"] & string>(fieldName: TFieldName, properties: ParameterizedAssociationProperties<TSchema["query"][" $associationTargetTypes"][TFieldName], TSchema["query"][" $associationArgs"][TFieldName]>): this;
    rootAssociationProperties<TFieldName extends keyof Exclude<TSchema["query"][" $associationTypes"], keyof TSchema["query"][" $associationArgs"]> & string>(fieldName: TFieldName, properties: UnparameterizedAssociationProperties<TSchema["query"][" $associationTargetTypes"][TFieldName]>): this;
    associationProperties<TTypeName extends keyof TSchema["entities"] & string, TFieldName extends keyof TSchema["entities"][TTypeName][" $associationArgs"] & string>(typeName: TTypeName, fieldName: TFieldName, properties: ParameterizedAssociationProperties<TSchema["entities"][TTypeName][" $associationTargetTypes"][TFieldName], TSchema["entities"][TTypeName][" $associationArgs"][TFieldName]>): this;
    associationProperties<TTypeName extends keyof TSchema["entities"] & string, TFieldName extends keyof Exclude<TSchema["entities"][TTypeName][" $associationTypes"], keyof TSchema["entities"][TTypeName][" $associationArgs"]> & string>(typeName: TTypeName, fieldName: TFieldName, properties: UnparameterizedAssociationProperties<TSchema["entities"][TTypeName][" $associationTargetTypes"][TFieldName]>): this;
    network(network: Network): this;
    buildStateManager(): StateManager<TSchema>;
}
export interface ParameterizedAssociationProperties<TScalarType, TVariables> {
    readonly contains?: (row: ScalarRow<TScalarType>, variables?: TVariables) => boolean | undefined;
    readonly position?: (row: ScalarRow<TScalarType>, rows: ReadonlyArray<ScalarRow<TScalarType>>, variables?: TVariables) => PositionType | undefined;
    readonly dependencies?: (variables?: TVariables) => ReadonlyArray<keyof TScalarType> | undefined;
}
export interface UnparameterizedAssociationProperties<TScalarType> {
    readonly contains?: (row: ScalarRow<TScalarType>) => boolean | undefined;
    readonly position?: (row: ScalarRow<TScalarType>, rows: ReadonlyArray<ScalarRow<TScalarType>>) => PositionType | undefined;
    readonly dependencies?: () => ReadonlyArray<keyof TScalarType> | undefined;
}
export interface ScalarRow<TScalarType extends {
    readonly [key: string]: any;
}> {
    has(fieldName: keyof TScalarType): boolean;
    get<TFieldName extends keyof TScalarType & string>(fieldName: TFieldName): TScalarType[TFieldName];
    toString(): string;
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
