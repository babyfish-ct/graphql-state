import { Fetcher } from "graphql-ts-client-api";
import { VariableArgs } from "../state/impl/Args";
export interface RuntimeShape {
    readonly typeName: string;
    readonly fieldMap: ReadonlyMap<string, RuntimeShapeField>;
    toString(): string;
}
export interface RuntimeShapeField {
    readonly name: string;
    readonly args?: VariableArgs;
    readonly alias?: string;
    readonly directives?: any;
    readonly childShape?: RuntimeShape;
    readonly nodeShape?: RuntimeShape;
}
export declare function toRuntimeShape<TVariables extends object>(fetcher: Fetcher<string, object, TVariables>, paginationConnName?: string, variables?: TVariables): RuntimeShape;
export declare function toRuntimeShape0(parentPath: string, fetcher: Fetcher<string, object, object>, paginationConnName?: string, variables?: object): RuntimeShape;
