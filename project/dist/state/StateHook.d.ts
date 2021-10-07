import { StateAccessingOptions, ParameterizedStateAccessingOptions, SingleWritableState, ParameterizedWritableState, SingleAsyncState, ParameterizedAsyncState, SingleState, ParameterizedState } from "./State";
import { StateManager } from "./StateManager";
import { SchemaType } from "../meta/SchemaType";
import { Fetcher } from "graphql-ts-client-api";
export declare function useStateManager<TSchema extends SchemaType>(): StateManager<TSchema>;
export declare function useStateValue<T>(state: SingleState<T>, options?: StateAccessingOptions): T;
export declare function useStateValue<T, TVariables>(state: ParameterizedState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables>): T;
export declare function useStateAccessor<T>(state: SingleWritableState<T>, options?: StateAccessingOptions): StateAccessor<T>;
export declare function useStateAccessor<T, TVariables>(state: ParameterizedWritableState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables>): StateAccessor<T>;
export declare function useStateAsyncValue<T>(state: SingleAsyncState<T>): UseStateAsyncValueHookResult<T>;
export declare function useStateAsyncValue<T, TVariables>(state: ParameterizedAsyncState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables>): UseStateAsyncValueHookResult<T>;
export declare function makeManagedObjectHooks<TSchema extends SchemaType>(): ManagedObjectHooks<TSchema>;
export interface StateAccessor<T> {
    (): T;
    (value: T): void;
}
export interface ManagedObjectHooks<TSchema extends SchemaType> {
    useManagedObject<TName extends keyof TSchema & string, T extends object, TVariables extends object>(fetcher: Fetcher<string, T, TVariables>, id: TSchema[TName][" $id"], variables?: TVariables): UseStateAsyncValueHookResult<T | undefined>;
    useManagedObjects<TName extends keyof TSchema & string, T extends object, TVariables extends object>(fetcher: Fetcher<string, T, TVariables>, ids: ReadonlyArray<TSchema[TName][" $id"]>, variables?: TVariables): UseStateAsyncValueHookResult<ReadonlyArray<T | undefined>>;
}
export interface UseStateAsyncValueHookResult<T> {
    readonly data: T;
    readonly loading: boolean;
    readonly error?: Error;
}
