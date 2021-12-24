import { StateManager } from "../state/StateManager";
import { Network, NetworkBuilder } from "./Network";
import { SchemaType } from "./SchemaType";

export interface Configuration<TSchema extends SchemaType> {

    
    bidirectionalAssociation<
        TTypeName extends keyof TSchema["entities"] & string, 
        TFieldName extends keyof TSchema["entities"][TTypeName][" $associationTypes"] & string, 
        TOppositeFieldName extends keyof TSchema["entities"][
            TSchema["entities"][TTypeName][" $associationTypes"][TFieldName]
        ][" $associationTypes"] & string
    >(
        typeName: TTypeName,
        fieldName: TFieldName,
        oppositeFieldName: TOppositeFieldName
    ): this;


    rootAssociationProperties<
        TFieldName extends keyof TSchema["query"][" $associationArgs"] & string
    >(
        fieldName: TFieldName,
        properties: ParameterizedAssociationProperties<
            TSchema["query"][" $associationTargetTypes"][TFieldName],
            TSchema["query"][" $associationArgs"][TFieldName]
        >
    ): this;

    rootAssociationProperties<
        TFieldName extends Exclude<
            keyof TSchema["query"][" $associationTypes"],
            keyof TSchema["query"][" $associationArgs"]
        > & string
    >(
        fieldName: TFieldName,
        properties: UnparameterizedAssociationProperties<
            TSchema["query"][" $associationTargetTypes"][TFieldName]
        >
    ): this;

    associationProperties<
        TTypeName extends keyof TSchema["entities"] & string, 
        TFieldName extends keyof TSchema["entities"][TTypeName][" $associationArgs"] & string
    >(
        typeName: TTypeName,
        fieldName: TFieldName,
        properties: ParameterizedAssociationProperties<
            TSchema["entities"][TTypeName][" $associationTargetTypes"][TFieldName],
            TSchema["entities"][TTypeName][" $associationArgs"][TFieldName]
        > & {
            readonly deleteCascade?: boolean;
        }
    ): this;

    associationProperties<
        TTypeName extends keyof TSchema["entities"] & string, 
        TFieldName extends Exclude<
            keyof TSchema["entities"][TTypeName][" $associationTypes"],
            keyof TSchema["entities"][TTypeName][" $associationArgs"]
        > & string
    >(
        typeName: TTypeName,
        fieldName: TFieldName,
        properties: UnparameterizedAssociationProperties<
            TSchema["entities"][TTypeName][" $associationTargetTypes"][TFieldName]
        > & {
            readonly deleteCascade?: boolean;
        }
    ): this;


    network(network: Network): this;

    networkBuilder(networkBuilder: NetworkBuilder): this;

    buildStateManager(): StateManager<TSchema>;
}

export interface ParameterizedAssociationProperties<TFlatType, TVariables> {

    readonly contains?: (
        row: FlatRow<TFlatType>,
        variables?: TVariables
    ) => boolean | undefined;

    readonly dependencies?: (
        variables?: TVariables
    ) => ReadonlyArray<keyof TFlatType> | undefined;

    readonly position?: (
        row: FlatRow<TFlatType>,
        rows: ReadonlyArray<FlatRow<TFlatType>>,
        paginationDirection?: "forward" | "backward",
        variables?: TVariables
    ) => PositionType | undefined;

    readonly range?: (
        range: ConnectionRange,
        delta: number,
        direction: "forward" | "backward"
    ) => void;
}

export interface UnparameterizedAssociationProperties<TFlatType> {

    readonly contains?: (
        row: FlatRow<TFlatType>
    ) => boolean | undefined;

    readonly dependencies?: (
    ) => ReadonlyArray<keyof TFlatType> | undefined;

    readonly position?: (
        row: FlatRow<TFlatType>,
        rows: ReadonlyArray<FlatRow<TFlatType>>,
        paginationDirection?: "forward" | "backward"
    ) => PositionType | undefined;

    readonly range?: (
        range: ConnectionRange,
        delta: number,
        direction: "forward" | "backward"
    ) => void;
}

export interface FlatRow<TFlatType extends {readonly [key: string]: any}> {
    has(fieldName: keyof TFlatType): boolean;
    get<TFieldName extends keyof TFlatType & string>(fieldName: TFieldName): TFlatType[TFieldName];
    toString(): string;
}

export type PositionType = number | "start" | "end";

export interface ConnectionRange {
    endCursor: string;
    [key: string]: any;
}

