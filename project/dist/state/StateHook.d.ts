import { SchemaTypes } from "../meta/SchemaTypes";
import { AsyncState, ComputedState, WriteableState, StateAccessingOptions } from "./State";
import { StateManager } from "./StateManager";
import { Shape, ObjectTypeOf } from "../meta/Shape";
import { GraphQLFetcher } from "../gql/GraphQLFetcher";
export declare function useStateManager<TSchema extends SchemaTypes>(): StateManager<TSchema>;
export declare function useStateValue<T, TVariables>(state: WriteableState<T, TVariables> | ComputedState<T, TVariables>, options: StateAccessingOptions<TVariables>): T;
export declare function useStateWriter<T, TVariables>(state: WriteableState<T, TVariables>, options: StateAccessingOptions<TVariables>): StateWriter<T>;
export declare function useStateAsyncValue<T, TVariables>(state: AsyncState<T, TVariables>, options: StateAccessingOptions<TVariables>): UseStateAsyncValueHookResult<T>;
export declare function makeManagedObjectHooks<TSchema extends SchemaTypes>(): ManagedObjectHooks<TSchema>;
export interface StateWriter<T> {
    (): T;
    (value: T): void;
}
export interface ManagedObjectHooks<TSchema extends SchemaTypes> {
    useManagedObject<TTypeName extends keyof TSchema, TShape extends Shape<TSchema[TTypeName]>>(typeName: TTypeName, options: {
        readonly id: any;
        readonly shape: TShape;
    }): UseStateAsyncValueHookResult<ObjectTypeOf<TSchema[TTypeName], TShape> | undefined>;
    useManagedObjects<TTypeName extends keyof TSchema, TShape extends Shape<TSchema[TTypeName]>>(typeName: TTypeName, options: {
        ids: readonly any[];
        shape: TShape;
    }): UseStateAsyncValueHookResult<ReadonlyArray<ObjectTypeOf<TSchema[TTypeName], TShape> | undefined>>;
    useManagedObject<TTypeName extends keyof TSchema & Exclude<string, "Query" | "Mutation">, TData extends object, TVariables extends object>(typeName: TTypeName, options: {
        readonly id: any;
        readonly fetcher: GraphQLFetcher<TTypeName, TData, TVariables>;
        readonly variables?: TVariables;
    }): UseStateAsyncValueHookResult<ObjectTypeOf<TSchema[TTypeName], TData> | undefined>;
    useManagedObjects<TTypeName extends keyof TSchema & Exclude<string, "Query" | "Mutation">, TData extends object, TVariables extends object>(typeName: TTypeName, options: {
        readonly ids: readonly any[];
        readonly fetcher: GraphQLFetcher<TTypeName, TData, TVariables>;
        readonly variables?: TVariables;
    }): UseStateAsyncValueHookResult<ObjectTypeOf<TSchema[TTypeName], TData> | undefined>;
}
export interface UseStateAsyncValueHookResult<T> {
    readonly data: T;
    readonly loading: boolean;
    readonly error?: Error;
}
