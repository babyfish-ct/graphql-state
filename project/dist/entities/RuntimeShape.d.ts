import { Fetcher } from "graphql-ts-client-api";
import { VariableArgs } from "./VariableArgs";
export interface RuntimeShape {
    readonly typeName: string;
    readonly fieldMap: ReadonlyMap<string, RuntimeShapeField>;
    toString(): string;
}
export interface RuntimeShapeField {
    readonly name: string;
    readonly args: VariableArgs;
    readonly alias?: string;
    readonly directives?: any;
    readonly childShape?: RuntimeShape;
}
export declare function toRuntimeShape<TVariables extends object>(fetcher: Fetcher<string, object, TVariables>, variables?: TVariables): RuntimeShape;
export declare function toRuntimeShape0(parentPath: string, fetcher: Fetcher<string, object, object>, variables?: object): RuntimeShape;
