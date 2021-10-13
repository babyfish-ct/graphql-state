import { StateAccessingOptions, ParameterizedStateAccessingOptions, SingleWritableState, ParameterizedWritableState, SingleAsyncState, ParameterizedAsyncState, SingleComputedState, ParameterizedComputedState } from "./State";
import { StateManager } from "./StateManager";
import { SchemaType } from "../meta/SchemaType";
import { Fetcher, ObjectFetcher } from "graphql-ts-client-api";
export declare function useStateManager<TSchema extends SchemaType>(): StateManager<TSchema>;
export declare function useStateValue<T>(state: SingleWritableState<T> | SingleComputedState<T>, options?: StateAccessingOptions): T;
export declare function useStateValue<T, TVariables>(state: ParameterizedWritableState<T, TVariables> | ParameterizedComputedState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables>): T;
export declare function useStateValue<T, TAsyncStyle extends AsyncStyles = "SUSPENSE">(state: SingleAsyncState<T>, options?: StateAccessingOptions & AsyncOptions<TAsyncStyle>): AsyncReturnType<T, TAsyncStyle>;
export declare function useStateValue<T, TVariables, TAsyncStyle extends AsyncStyles = "SUSPENSE">(state: ParameterizedAsyncState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables> & AsyncOptions<TAsyncStyle>): AsyncReturnType<T, TAsyncStyle>;
export declare function useStateValue<T, TVariables>(state: ParameterizedWritableState<T, TVariables> | ParameterizedComputedState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables>): T;
export declare function useStateAccessor<T>(state: SingleWritableState<T>, options?: StateAccessingOptions): StateAccessor<T>;
export declare function useStateAccessor<T, TVariables>(state: ParameterizedWritableState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables>): StateAccessor<T>;
export interface StateAccessor<T> {
    (): T;
    (value: T): void;
}
export interface AsyncOptions<TAsyncStyle extends AsyncStyles = "SUSPENSE"> {
    readonly asyncStyle?: TAsyncStyle;
}
export declare type AsyncReturnType<T, TAsyncStyle extends AsyncStyles> = TAsyncStyle extends "ASYNC_OBJECT" ? UseStateAsyncValueHookResult<T> : TAsyncStyle extends "REFRESHABLE_SUSPENSE" ? [
    T
] : T;
export declare type AsyncStyles = "SUSPENSE" | "REFRESHABLE_SUSPENSE" | "ASYNC_OBJECT";
export interface UseStateAsyncValueHookResult<T> {
    readonly data: T;
    readonly loading: boolean;
    readonly error?: Error;
}
export declare function useQuery<T extends object, TVaraibles extends object, TAsyncStyle extends AsyncStyles = "SUSPENSE">(fetcher: ObjectFetcher<"Query", T, TVaraibles>, options?: QueryOptions<TVaraibles, TAsyncStyle>): AsyncReturnType<T, TAsyncStyle>;
export declare function makeManagedObjectHooks<TSchema extends SchemaType>(): ManagedObjectHooks<TSchema>;
export interface ManagedObjectHooks<TSchema extends SchemaType> {
    useObject<TName extends keyof TSchema & string, T extends object, TVariables extends object, TAsyncStyle extends AsyncStyles = "SUSPENSE", TObjectStyle extends ObjectStyles = "REQUIRED">(fetcher: Fetcher<string, T, TVariables>, id: TSchema[TName][" $id"], options?: ObjectQueryOptions<TVariables, TAsyncStyle, TObjectStyle>): AsyncReturnType<ObjectReference<T, TObjectStyle>, TAsyncStyle>;
    useObjects<TName extends keyof TSchema & string, T extends object, TVariables extends object, TAsyncStyle extends AsyncStyles = "SUSPENSE", TObjectStyle extends ObjectStyles = "REQUIRED">(fetcher: Fetcher<string, T, TVariables>, ids: ReadonlyArray<TSchema[TName][" $id"]>, options?: ObjectQueryOptions<TVariables, TAsyncStyle, TObjectStyle>): AsyncReturnType<ReadonlyArray<ObjectReference<T, TObjectStyle>>, TAsyncStyle>;
}
export interface QueryOptions<TVariables extends object, TAsyncStyle extends AsyncStyles> extends AsyncOptions<TAsyncStyle> {
    readonly variables?: TVariables;
}
export declare type ObjectStyles = "REQUIRED" | "OPTIONAL";
export interface ObjectQueryOptions<TVariables extends object, TAsyncStyle extends AsyncStyles, TObjectStyle extends ObjectStyles> extends QueryOptions<TVariables, TAsyncStyle> {
    readonly objectStyle: TObjectStyle;
}
declare type ObjectReference<T, TObjectStyle extends ObjectStyles> = TObjectStyle extends "REQUIRED" ? T : T | undefined;
export {};
