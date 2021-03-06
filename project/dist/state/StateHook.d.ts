import { AsyncOptions, AsyncPaginationReturnType, AsyncReturnType, AsyncStyle, MutationOptions, MutationReturnType, ObjectQueryOptions, TypeReference, ObjectStyle, PaginationQueryOptions, ParameterizedStateAccessingOptions, QueryOptions, StateAccessingOptions, StateAccessor } from "./Types";
import { SingleWritableState, ParameterizedWritableState, SingleAsyncState, ParameterizedAsyncState, SingleComputedState, ParameterizedComputedState } from "./State";
import { StateManager } from "./StateManager";
import { SchemaType } from "../meta/SchemaType";
import { Fetcher, ObjectFetcher } from "graphql-ts-client-api";
export declare function useStateManager<TSchema extends SchemaType>(): StateManager<TSchema>;
export declare function useStateValue<T>(state: SingleWritableState<T> | SingleComputedState<T>, options?: StateAccessingOptions): T;
export declare function useStateValue<T, TVariables extends object>(state: ParameterizedWritableState<T, TVariables> | ParameterizedComputedState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables>): T;
export declare function useStateValue<T, TAsyncStyle extends AsyncStyle = "suspense">(state: SingleAsyncState<T>, options?: StateAccessingOptions & AsyncOptions<TAsyncStyle>): AsyncReturnType<T, TAsyncStyle>;
export declare function useStateValue<T, TVariables extends object, TAsyncStyle extends AsyncStyle = "suspense">(state: ParameterizedAsyncState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables> & AsyncOptions<TAsyncStyle, TVariables>): AsyncReturnType<T, TAsyncStyle>;
export declare function useStateAccessor<T>(state: SingleWritableState<T>, options?: StateAccessingOptions): StateAccessor<T>;
export declare function useStateAccessor<T, TVariables>(state: ParameterizedWritableState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables>): StateAccessor<T>;
export declare function useQuery<T extends object, TVariables extends object, TAsyncStyle extends AsyncStyle = "suspense">(fetcher: ObjectFetcher<"Query", T, TVariables>, options?: QueryOptions<TVariables> & AsyncOptions<TAsyncStyle, TVariables>): AsyncReturnType<T, TAsyncStyle>;
export declare function usePaginationQuery<T extends object, TVariables extends object, TAsyncStyle extends AsyncStyle = "suspense">(fetcher: ObjectFetcher<"Query", T, TVariables>, options?: PaginationQueryOptions<TVariables> & AsyncOptions<TAsyncStyle, TVariables>): AsyncPaginationReturnType<T, TAsyncStyle>;
export declare function useMutation<T extends object, TVariables extends object>(fetcher: ObjectFetcher<"Mutation", T, TVariables>, options?: MutationOptions<T, TVariables>): MutationReturnType<T, TVariables>;
export declare function makeManagedObjectHooks<TSchema extends SchemaType>(): ManagedObjectHooks<TSchema>;
export interface ManagedObjectHooks<TSchema extends SchemaType> {
    useObject<TName extends keyof TSchema["entities"] & string, T extends object, TVariables extends object, TAsyncStyle extends AsyncStyle = "suspense", TObjectStyle extends ObjectStyle = "required">(fetcher: Fetcher<string, T, TVariables>, id: TypeReference<TSchema["entities"][TName][" $id"], TObjectStyle>, options?: ObjectQueryOptions<TVariables, TObjectStyle> & AsyncOptions<TAsyncStyle, TVariables>): AsyncReturnType<TypeReference<T, TObjectStyle>, TAsyncStyle>;
    useObjects<TName extends keyof TSchema["entities"] & string, T extends object, TVariables extends object, TAsyncStyle extends AsyncStyle = "suspense", TObjectStyle extends ObjectStyle = "required">(fetcher: Fetcher<string, T, TVariables>, ids: ReadonlyArray<TypeReference<TSchema["entities"][TName][" $id"], TObjectStyle>>, options?: ObjectQueryOptions<TVariables, TObjectStyle> & AsyncOptions<TAsyncStyle, TVariables>): AsyncReturnType<ReadonlyArray<TypeReference<T, TObjectStyle>>, TAsyncStyle>;
}
