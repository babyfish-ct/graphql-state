import { StateAccessingOptions, ParameterizedStateAccessingOptions, SingleWritableState, ParameterizedWritableState, SingleAsyncState, ParameterizedAsyncState, SingleComputedState, ParameterizedComputedState } from "./State";
import { StateManager } from "./StateManager";
import { SchemaType } from "../meta/SchemaType";
import { Fetcher, ObjectFetcher } from "graphql-ts-client-api";
import { Loadable } from "./impl/StateValue";
export declare function useStateManager<TSchema extends SchemaType>(): StateManager<TSchema>;
export declare function useStateValue<T>(state: SingleWritableState<T> | SingleComputedState<T>, options?: StateAccessingOptions): T;
export declare function useStateValue<T, TVariables>(state: ParameterizedWritableState<T, TVariables> | ParameterizedComputedState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables>): T;
export declare function useStateValue<T, TAsyncStyle extends AsyncStyle = "suspense">(state: SingleAsyncState<T>, options?: StateAccessingOptions & AsyncOptions<TAsyncStyle>): AsyncReturnType<T, TAsyncStyle>;
export declare function useStateValue<T, TVariables, TAsyncStyle extends AsyncStyle = "suspense">(state: ParameterizedAsyncState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables> & AsyncOptions<TAsyncStyle>): AsyncReturnType<T, TAsyncStyle>;
export declare function useStateValue<T, TVariables>(state: ParameterizedWritableState<T, TVariables> | ParameterizedComputedState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables>): T;
export declare function useStateAccessor<T>(state: SingleWritableState<T>, options?: StateAccessingOptions): StateAccessor<T>;
export declare function useStateAccessor<T, TVariables>(state: ParameterizedWritableState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables>): StateAccessor<T>;
export interface StateAccessor<T> {
    (): T;
    (value: T): void;
}
export interface AsyncOptions<TAsyncStyle extends AsyncStyle = "suspense"> {
    readonly asyncStyle?: TAsyncStyle;
}
export interface UseStateAsyncValueHookResult<T> {
    readonly data: T;
    readonly loading: boolean;
    readonly error?: Error;
    readonly refetch: () => void;
}
export declare type AsyncReturnType<T, TAsyncStyle extends AsyncStyle> = TAsyncStyle extends "async-object" ? UseStateAsyncValueHookResult<T> : TAsyncStyle extends "refetchable-suspense" ? [
    T,
    () => void
] : T;
export declare type AsyncPaginationReturnType<T, TAsyncStyle extends AsyncStyle> = (TAsyncStyle extends "async-object" ? {
    readonly loading: boolean;
    readonly error: any;
} : {}) & {
    readonly data: T;
    readonly refetch: () => void;
    readonly loadNext: () => void;
    readonly loadPrevious: () => void;
    readonly hasNext: boolean;
    readonly hasPrevious: boolean;
    readonly isLoadingNext: boolean;
    readonly isLoadingPrevious: boolean;
};
export declare type AsyncStyle = "suspense" | "refetchable-suspense" | "async-object";
export declare function useQuery<T extends object, TVaraibles extends object, TAsyncStyle extends AsyncStyle = "suspense">(fetcher: ObjectFetcher<"Query", T, TVaraibles>, options?: QueryOptions<TVaraibles, TAsyncStyle>): AsyncReturnType<T, TAsyncStyle>;
export declare function usePaginationQuery<T extends object, TVaraibles extends object, TAsyncStyle extends AsyncStyle = "suspense">(fetcher: ObjectFetcher<"Query", T, TVaraibles>, options?: PaginationQueryOptions<TVaraibles, TAsyncStyle>): AsyncPaginationReturnType<T, TAsyncStyle>;
export declare function useMutation<T extends object, TVaraibles extends object>(fetcher: ObjectFetcher<"Mutation", T, TVaraibles>, options?: MutationOptions<T, TVaraibles>): [(variables?: TVaraibles) => Promise<T>, Loadable<T>];
export declare function makeManagedObjectHooks<TSchema extends SchemaType>(): ManagedObjectHooks<TSchema>;
export interface ManagedObjectHooks<TSchema extends SchemaType> {
    useObject<TName extends keyof TSchema["entities"] & string, T extends object, TVariables extends object, TAsyncStyle extends AsyncStyle = "suspense", TObjectStyle extends ObjectStyle = "required">(fetcher: Fetcher<string, T, TVariables>, id: TSchema["entities"][TName][" $id"], options?: ObjectQueryOptions<TVariables, TAsyncStyle, TObjectStyle>): AsyncReturnType<ObjectReference<T, TObjectStyle>, TAsyncStyle>;
    useObjects<TName extends keyof TSchema["entities"] & string, T extends object, TVariables extends object, TAsyncStyle extends AsyncStyle = "suspense", TObjectStyle extends ObjectStyle = "required">(fetcher: Fetcher<string, T, TVariables>, ids: ReadonlyArray<TSchema["entities"][TName][" $id"]>, options?: ObjectQueryOptions<TVariables, TAsyncStyle, TObjectStyle>): AsyncReturnType<ReadonlyArray<ObjectReference<T, TObjectStyle>>, TAsyncStyle>;
}
export interface QueryOptions<TVariables extends object, TAsyncStyle extends AsyncStyle> extends AsyncOptions<TAsyncStyle> {
    readonly variables?: TVariables;
    readonly mode?: QueryMode;
}
export interface PaginationQueryOptions<TVariables extends object, TAsyncStyle extends AsyncStyle> extends QueryOptions<TVariables, TAsyncStyle> {
    readonly windowId: string;
    readonly initialSize: number;
    readonly pageSize?: number;
    readonly paginiationStyle?: PaginationStyle;
}
export interface MutationOptions<T, TVariables extends object> {
    readonly variables?: TVariables;
    readonly onSuccess?: (data: T) => void;
    readonly onError?: (error: any) => void;
    readonly onCompelete?: (data: T | undefined, error: any) => void;
}
export declare type QueryMode = "cache-and-network" | "cache-only";
export declare type ObjectStyle = "required" | "optional";
export declare type PaginationStyle = "forward" | "backward" | "page";
export interface ObjectQueryOptions<TVariables extends object, TAsyncStyle extends AsyncStyle, TObjectStyle extends ObjectStyle> extends QueryOptions<TVariables, TAsyncStyle> {
    readonly objectStyle: TObjectStyle;
}
declare type ObjectReference<T, TObjectStyle extends ObjectStyle> = TObjectStyle extends "required" ? T : T | undefined;
export {};
