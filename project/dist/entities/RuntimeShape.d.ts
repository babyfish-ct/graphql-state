import { Fetcher } from "graphql-ts-client-api";
export interface RuntimeShape {
    readonly typeName: string;
    readonly fields: RuntimeShapeField[];
}
export interface RuntimeShapeField {
    readonly name: string;
    readonly variables?: any;
    readonly alias?: string;
    readonly directives?: any;
    readonly childShape?: RuntimeShape;
}
export declare function toRuntimeShape<TVariables extends object>(fetcher: Fetcher<string, any, TVariables>, variables?: TVariables): RuntimeShape;
