import { useContext, useEffect, useMemo, useState } from "react";
import { 
    AsyncOptions, 
    AsyncPaginationReturnType, 
    AsyncReturnType, 
    AsyncStyle, 
    MutationOptions, 
    MutationReturnType, 
    ObjectQueryOptions, 
    TypeReference, 
    ObjectStyle, 
    PaginationQueryOptions, 
    ParameterizedStateAccessingOptions, 
    QueryOptions, 
    StateAccessingOptions, 
    StateAccessor, 
    UseStateAsyncValueHookResult 
} from "./Types";
import { 
    State, 
    SingleWritableState, 
    ParameterizedWritableState, 
    SingleAsyncState, 
    ParameterizedAsyncState, 
    SingleComputedState, 
    ParameterizedComputedState
} from "./State";
import { StateManager } from "./StateManager";
import { stateContext } from "./StateManagerProvider";
import { StateManagerImpl } from "./impl/StateManagerImpl";
import { WritableStateValue } from "./impl/WritableStateValue";
import { ComputedStateValue } from "./impl/ComputedStateValue";
import { SchemaType } from "../meta/SchemaType";
import { Fetcher, ObjectFetcher } from "graphql-ts-client-api";
import { MutationResultHolder, QueryResultHolder, StateValueHolder } from "./impl/Holder";
import { useScopePath } from "./StateScope";

export function useStateManager<TSchema extends SchemaType>(): StateManager<TSchema> {
    const stateManager = useContext(stateContext);
    if (stateManager === undefined) {
        throw new Error("'useStateManager' cannoly be used under <StateManagerProvider/>");
    }
    return stateManager;
}

export function useStateValue<T>(
    state: SingleWritableState<T> | SingleComputedState<T>,
    options?: StateAccessingOptions
): T;

export function useStateValue<T, TVariables extends object>(
    state: ParameterizedWritableState<T, TVariables> | ParameterizedComputedState<T, TVariables>,
    options: ParameterizedStateAccessingOptions<TVariables>
): T;

export function useStateValue<T, TAsyncStyle extends AsyncStyle = "suspense">(
    state: SingleAsyncState<T>,
    options?: StateAccessingOptions & AsyncOptions<TAsyncStyle>
): AsyncReturnType<T, TAsyncStyle>;

export function useStateValue<T, TVariables extends object, TAsyncStyle extends AsyncStyle = "suspense">(
    state: ParameterizedAsyncState<T, TVariables>,
    options: ParameterizedStateAccessingOptions<TVariables> & AsyncOptions<TAsyncStyle, TVariables>
): AsyncReturnType<T, TAsyncStyle>;

export function useStateValue<T>(
    state: State<T>,
    options?: StateAccessingOptions
): any {
    const stateValueHolder = useInternalStateValueHolder(state, options);
    try {
        const stateValue = stateValueHolder.get();
        if (state[" $stateType"] !== "ASYNC") {
            return stateValue.result;
        }
        const loadable = (stateValue as ComputedStateValue).loadable as UseStateAsyncValueHookResult<T>;
        const asyncStyle = (options as AsyncOptions<any, any> | undefined)?.asyncStyle;
        if (asyncStyle === "async-object") {
            return loadable;
        }
        if (loadable.loading) {
            throw stateValue.result; // throws promise, <suspense/> will catch it
        }
        if (loadable.error) {
            throw loadable.error;
        }
        if (asyncStyle === "refetchable-suspense") {
            return [loadable.data, loadable.refetch];
        }
        return loadable.data;
    } catch (ex) {
        stateValueHolder.release();
        throw ex;
    }
}

export function useStateAccessor<T>(
    state: SingleWritableState<T>,
    options?: StateAccessingOptions
): StateAccessor<T>;

export function useStateAccessor<T, TVariables>(
    state: ParameterizedWritableState<T, TVariables>,
    options: ParameterizedStateAccessingOptions<TVariables>
): StateAccessor<T>;

export function useStateAccessor<T>(
    state: SingleWritableState<T> | ParameterizedWritableState<T, any>,
    options?: StateAccessingOptions
): StateAccessor<T> {
    const stateValueHolder = useInternalStateValueHolder(state, options);
    try {
        const stateValue = stateValueHolder.get();
        return (stateValue as WritableStateValue).accessor;
    } catch (ex) {
        stateValueHolder.release();
        throw ex;
    }
}

export function useQuery<
    T extends object,
    TVariables extends object,
    TAsyncStyle extends AsyncStyle = "suspense"
>(
    fetcher: ObjectFetcher<"Query", T, TVariables>,
    options?: QueryOptions<TVariables> & AsyncOptions<TAsyncStyle, TVariables>
): AsyncReturnType<T, TAsyncStyle> {
    const queryResultHolder = useInternalQueryResultHolder(fetcher, undefined, undefined, options);
    try {
        const queryResult = queryResultHolder.get();
        if (options?.asyncStyle === "async-object") {
            return queryResult.loadable as AsyncReturnType<T, TAsyncStyle>;
        }
        if (queryResult.loadable.loading) {
            throw queryResult.promise; // throws promise, <suspense/> will catch it
        }
        if (queryResult.loadable.error) {
            throw queryResult.loadable.error;
        }
        if (options?.asyncStyle === "refetchable-suspense") {
            return { 
                data: queryResult.loadable.data, 
                refetch: queryResult.loadable.refetch 
            } as AsyncReturnType<T, TAsyncStyle>;
        }
        return queryResult.loadable.data;
    } catch (ex) {
        queryResultHolder.release();
        throw ex;
    }
}

export function usePaginationQuery<
    T extends object,
    TVariables extends object,
    TAsyncStyle extends AsyncStyle = "suspense"
>(
    fetcher: ObjectFetcher<"Query", T, TVariables>,
    options?: PaginationQueryOptions<TVariables> & AsyncOptions<TAsyncStyle, TVariables>,    
): AsyncPaginationReturnType<T, TAsyncStyle> {
    const queryResultHolder = useInternalQueryResultHolder(
        fetcher, options?.windowId, undefined, options
    );
    try {
        const queryResult = queryResultHolder.get();
        if (options?.asyncStyle === "async-object") {
            return queryResult.loadable as any as AsyncPaginationReturnType<T, TAsyncStyle>;
        }
        if (queryResult.loadable.loading) {
            throw queryResult.promise; // throws promise, <suspense/> will catch it
        }
        if (queryResult.loadable.error) {
            throw queryResult.loadable.error;
        }
        return queryResult.loadable as any as AsyncPaginationReturnType<T, TAsyncStyle>;
    } catch (ex) {
        queryResultHolder.release();
        throw ex;
    }
}

export function useMutation<
    T extends object,
    TVariables extends object
>(
    fetcher: ObjectFetcher<"Mutation", T, TVariables>,
    options?: MutationOptions<T, TVariables>
): MutationReturnType<T, TVariables> {
    const stateManager = useStateManager() as StateManagerImpl<any>;
    const [, setMutationResultVersion] = useState(0);
    const [holder] = useState(() => new MutationResultHolder(stateManager, setMutationResultVersion));
    holder.set(fetcher, options);
    const result = holder.get();
    return { 
        mutate: result.mutate, 
        data: result.loadable.data,
        loading: result.loadable.loading,
        error: result.loadable.error,
    };
}

export function makeManagedObjectHooks<TSchema extends SchemaType>(): ManagedObjectHooks<TSchema> {
    return new ManagedObjectHooksImpl<TSchema>();
}

export interface ManagedObjectHooks<TSchema extends SchemaType> {

    useObject<
        TName extends keyof TSchema["entities"] & string,
        T extends object,
        TVariables extends object,
        TAsyncStyle extends AsyncStyle = "suspense",
        TObjectStyle extends ObjectStyle = "required",
    >(
        fetcher: Fetcher<string, T, TVariables>,
        id: TypeReference<TSchema["entities"][TName][" $id"], TObjectStyle>,
        options?: ObjectQueryOptions<TVariables, TObjectStyle> & AsyncOptions<TAsyncStyle, TVariables>
    ): AsyncReturnType<
        TypeReference<T, TObjectStyle>,
        TAsyncStyle
    >;

    useObjects<
        TName extends keyof TSchema["entities"] & string,
        T extends object,
        TVariables extends object,
        TAsyncStyle extends AsyncStyle = "suspense",
        TObjectStyle extends ObjectStyle = "required"
    >(
        fetcher: Fetcher<string, T, TVariables>,
        ids: ReadonlyArray<TypeReference<TSchema["entities"][TName][" $id"], TObjectStyle>>,
        options?: ObjectQueryOptions<TVariables, TObjectStyle> & AsyncOptions<TAsyncStyle, TVariables>
    ): AsyncReturnType<
        ReadonlyArray<TypeReference<T, TObjectStyle>>,
        TAsyncStyle
    >;
}

class ManagedObjectHooksImpl<TSchema extends SchemaType> implements ManagedObjectHooks<TSchema> {

    useObject<
        TName extends keyof TSchema["entities"] & string,
        T extends object,
        TVariables extends object,
        TAsyncStyle extends AsyncStyle = "suspense",
        TObjectStyle extends ObjectStyle = "required"
    >(
        fetcher: ObjectFetcher<string, T, TVariables>,
        id: TSchema["entities"][TName][" $id"],
        options?: ObjectQueryOptions<TVariables, TObjectStyle> & AsyncOptions<TAsyncStyle, TVariables>
    ): AsyncReturnType<
    TypeReference<T, TObjectStyle>,
        TAsyncStyle
    > {
        const queryResultHolder = useInternalQueryResultHolder(fetcher, undefined, [id], options);
        try {
            const queryResult = queryResultHolder.get();
            if (options?.asyncStyle === "async-object") {
                return { 
                    ...queryResult.loadable,
                    data: queryResult.loadable.data !== undefined ? queryResult.loadable.data[0] : undefined
                } as AsyncReturnType<
                    TypeReference<T, TObjectStyle>,
                    TAsyncStyle
                >;
            }
            if (queryResult.loadable.loading) {
                throw queryResult.promise; // throws promise, <suspense/> will catch it
            }
            if (queryResult.loadable.error) {
                throw queryResult.loadable.error;
            }
            if (options?.asyncStyle === "refetchable-suspense") {
                return {
                    data: queryResult.loadable.data[0], 
                    refetch: queryResult.loadable.refetch
                } as AsyncReturnType<
                    TypeReference<T, TObjectStyle>,
                    TAsyncStyle
                >;
            }
            return queryResult.loadable.data[0] as AsyncReturnType<
                TypeReference<T, TObjectStyle>,
                TAsyncStyle
            >;
        } catch (ex) {
            queryResultHolder.release();
            throw ex;
        }
    }

    useObjects<
        TName extends keyof TSchema["entities"] & string,
        T extends object,
        TVariables extends object,
        TAsyncStyle extends AsyncStyle = "suspense",
        TObjectStyle extends ObjectStyle = "required"
    >(
        fetcher: ObjectFetcher<string, T, TVariables>,
        ids: ReadonlyArray<TSchema["entities"][TName][" $id"]>,
        options?: ObjectQueryOptions<TVariables, TObjectStyle> & AsyncOptions<TAsyncStyle, TVariables>
    ): AsyncReturnType<
        ReadonlyArray<TypeReference<T, TObjectStyle>>,
        TAsyncStyle
    > {
        const queryResultHolder = useInternalQueryResultHolder(fetcher, undefined, ids, options);
        try {
            const queryResult = queryResultHolder.get();
            if (options?.asyncStyle === "async-object") {
                return queryResult.loadable as AsyncReturnType<
                    ReadonlyArray<TypeReference<T, TObjectStyle>>,
                    TAsyncStyle
                >;
            }
            if (queryResult.loadable.loading) {
                throw queryResult.promise; // throws promise, <suspense/> will catch it
            }
            if (queryResult.loadable.error) {
                throw queryResult.loadable.error;
            }
            if (options?.asyncStyle === "refetchable-suspense") {
                return { 
                    data: queryResult.loadable.data, 
                    refetch: queryResult.loadable.refetch
                } as AsyncReturnType<
                ReadonlyArray<TypeReference<T, TObjectStyle>>,
                    TAsyncStyle
                >;
            }
            return queryResult.loadable.data as AsyncReturnType<
            ReadonlyArray<TypeReference<T, TObjectStyle>>,
                TAsyncStyle
            >;
        } catch (ex) {
            queryResultHolder.release();
            throw ex;
        }
    }
}

function useInternalStateValueHolder(
    state: State<any>,
    options?: StateAccessingOptions
): StateValueHolder {

    const stateManager = useStateManager() as StateManagerImpl<any>;
    const [, setStateValueVersion] = useState(0);
    const scopePath = useScopePath();
    const stateValueHolder = useMemo(() => { 
        return new StateValueHolder(stateManager, scopePath, setStateValueVersion);
    }, [stateManager, scopePath, setStateValueVersion]);
    stateValueHolder.set(state, scopePath, options);
    useEffect(() => {
        return () => {
            stateValueHolder.release();
        }
    }, [stateValueHolder]);
    return stateValueHolder;
}

function useInternalQueryResultHolder(
    fetcher: ObjectFetcher<string, object, object>,
    windowId: string | undefined,
    ids?: ReadonlyArray<any>,
    options?: QueryOptions<any>
): QueryResultHolder {

    const stateManager = useStateManager() as StateManagerImpl<any>;
    const [, setQueryResultVersion] = useState(0);
    const queryResultHolder = useMemo(() => {
        return new QueryResultHolder(stateManager, setQueryResultVersion);
    }, [stateManager, setQueryResultVersion]);
    queryResultHolder.set(fetcher, windowId, ids, options);
    useEffect(() => {
        return () => {
            queryResultHolder.release();
        }
    }, [queryResultHolder]);
    return queryResultHolder;
}
