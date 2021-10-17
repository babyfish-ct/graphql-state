import { useContext, useEffect, useState } from "react";
import { 
    StateAccessingOptions, 
    State, 
    ParameterizedStateAccessingOptions, 
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
import { QueryResultHolder, StateValueHolder } from "./impl/Holder";

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

export function useStateValue<T, TVariables>(
    state: ParameterizedWritableState<T, TVariables> | ParameterizedComputedState<T, TVariables>,
    options: ParameterizedStateAccessingOptions<TVariables>
): T;

export function useStateValue<T, TAsyncStyle extends AsyncStyles = "SUSPENSE">(
    state: SingleAsyncState<T>,
    options?: StateAccessingOptions & AsyncOptions<TAsyncStyle>
): AsyncReturnType<T, TAsyncStyle>;

export function useStateValue<T, TVariables, TAsyncStyle extends AsyncStyles = "SUSPENSE">(
    state: ParameterizedAsyncState<T, TVariables>,
    options: ParameterizedStateAccessingOptions<TVariables> & AsyncOptions<TAsyncStyle>
): AsyncReturnType<T, TAsyncStyle>;

export function useStateValue<T, TVariables>(
    state: ParameterizedWritableState<T, TVariables> | ParameterizedComputedState<T, TVariables>,
    options: ParameterizedStateAccessingOptions<TVariables>
): T;

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
        const asyncStyle = (options as AsyncOptions<any> | undefined)?.asyncStyle;
        if (asyncStyle === "ASYNC_OBJECT") {
            return loadable;
        }
        if (loadable.loading) {
            throw stateValue.result; // throws promise, <Suspense/> will catch it
        }
        if (loadable.error) {
            throw loadable.error;
        }
        if (asyncStyle === "REFRESHABLE_SUSPENSE") {
            return [loadable.data];
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

export interface StateAccessor<T> {
    (): T;
    (value: T): void;
}

export interface AsyncOptions<TAsyncStyle extends AsyncStyles = "SUSPENSE"> {
    readonly asyncStyle?: TAsyncStyle;
}

export type AsyncReturnType<T, TAsyncStyle extends AsyncStyles> =
    TAsyncStyle extends "ASYNC_OBJECT" ?
    UseStateAsyncValueHookResult<T> :
    TAsyncStyle extends "REFRESHABLE_SUSPENSE" ?
    [T] :
    T
;

export type AsyncStyles = "SUSPENSE" | "REFRESHABLE_SUSPENSE" | "ASYNC_OBJECT";

export interface UseStateAsyncValueHookResult<T> {
    readonly data: T;
    readonly loading: boolean;
    readonly error?: Error;
}

export function useQuery<
    T extends object,
    TVaraibles extends object,
    TAsyncStyle extends AsyncStyles = "SUSPENSE"
>(
    fetcher: ObjectFetcher<"Query", T, TVaraibles>,
    options?: QueryOptions<TVaraibles, TAsyncStyle>
): AsyncReturnType<T, TAsyncStyle> {
    const queryResultHolder = useInternalQueryResultHolder(fetcher, undefined, options?.variables);
    try {
        const queryResult = queryResultHolder.get();
        if (options?.asyncStyle === "ASYNC_OBJECT") {
            return queryResult.loadable as AsyncReturnType<T, TAsyncStyle>;
        }
        if (queryResult.loadable.loading) {
            throw queryResult.promise; // throws promise, <Suspense/> will catch it
        }
        if (queryResult.loadable.error) {
            throw queryResult.loadable.error;
        }
        if (options?.asyncStyle === "REFRESHABLE_SUSPENSE") {
            return [queryResult.loadable.data] as AsyncReturnType<T, TAsyncStyle>;
        }
        return queryResult.loadable.data as AsyncReturnType<T, TAsyncStyle>;
    } catch (ex) {
        queryResultHolder.release();
        throw ex;
    }
}

export function makeManagedObjectHooks<TSchema extends SchemaType>(): ManagedObjectHooks<TSchema> {
    return new ManagedObjectHooksImpl<TSchema>();
}

export interface ManagedObjectHooks<TSchema extends SchemaType> {

    useObject<
        TName extends keyof TSchema["entities"] & string,
        T extends object,
        TVariables extends object,
        TAsyncStyle extends AsyncStyles = "SUSPENSE",
        TObjectStyle extends ObjectStyles = "REQUIRED",
    >(
        fetcher: Fetcher<string, T, TVariables>,
        id: TSchema["entities"][TName][" $id"],
        options?: ObjectQueryOptions<TVariables, TAsyncStyle, TObjectStyle>
    ): AsyncReturnType<
        ObjectReference<T, TObjectStyle>,
        TAsyncStyle
    >;

    useObjects<
        TName extends keyof TSchema["entities"] & string,
        T extends object,
        TVariables extends object,
        TAsyncStyle extends AsyncStyles = "SUSPENSE",
        TObjectStyle extends ObjectStyles = "REQUIRED"
    >(
        fetcher: Fetcher<string, T, TVariables>,
        ids: ReadonlyArray<TSchema["entities"][TName][" $id"]>,
        options?: ObjectQueryOptions<TVariables, TAsyncStyle, TObjectStyle>
    ): AsyncReturnType<
        ReadonlyArray<ObjectReference<T, TObjectStyle>>,
        TAsyncStyle
    >;
}

export interface QueryOptions<TVariables extends object, TAsyncStyle extends AsyncStyles> extends AsyncOptions<TAsyncStyle> {
    readonly variables?: TVariables;
}

export type ObjectStyles = "REQUIRED" | "OPTIONAL";

export interface ObjectQueryOptions<TVariables extends object, TAsyncStyle extends AsyncStyles, TObjectStyle extends ObjectStyles> 
extends QueryOptions<TVariables, TAsyncStyle> {
    readonly objectStyle: TObjectStyle;
}

type ObjectReference<T, TObjectStyle extends ObjectStyles> = TObjectStyle extends "REQUIRED" ? T : T | undefined;

class ManagedObjectHooksImpl<TSchema extends SchemaType> implements ManagedObjectHooks<TSchema> {

    useObject<
        TName extends keyof TSchema["entities"] & string,
        T extends object,
        TVariables extends object,
        TAsyncStyle extends AsyncStyles = "SUSPENSE",
        TObjectStyle extends ObjectStyles = "REQUIRED"
    >(
        fetcher: ObjectFetcher<string, T, TVariables>,
        id: TSchema["entities"][TName][" $id"],
        options?: ObjectQueryOptions<TVariables, TAsyncStyle, TObjectStyle>
    ): AsyncReturnType<
        ObjectReference<T, TObjectStyle>,
        TAsyncStyle
    > {
        const queryResultHolder = useInternalQueryResultHolder(fetcher, [id], options?.variables);
        try {
            const queryResult = queryResultHolder.get();
            if (options?.asyncStyle === "ASYNC_OBJECT") {
                return queryResult.loadable as AsyncReturnType<
                    ObjectReference<T, TObjectStyle>,
                    TAsyncStyle
                >;
            }
            if (queryResult.loadable.loading) {
                throw queryResult.promise; // throws promise, <Suspense/> will catch it
            }
            if (queryResult.loadable.error) {
                throw queryResult.loadable.error;
            }
            if (options?.asyncStyle === "REFRESHABLE_SUSPENSE") {
                return [queryResult.loadable.data] as AsyncReturnType<
                    ObjectReference<T, TObjectStyle>,
                    TAsyncStyle
                >;
            }
            return queryResult.loadable.data as AsyncReturnType<
                ObjectReference<T, TObjectStyle>,
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
        TAsyncStyle extends AsyncStyles = "SUSPENSE",
        TObjectStyle extends ObjectStyles = "REQUIRED"
    >(
        fetcher: ObjectFetcher<string, T, TVariables>,
        ids: ReadonlyArray<TSchema["entities"][TName][" $id"]>,
        options?: ObjectQueryOptions<TVariables, TAsyncStyle, TObjectStyle>
    ): AsyncReturnType<
        ReadonlyArray<ObjectReference<T, TObjectStyle>>,
        TAsyncStyle
    > {
        const queryResultHolder = useInternalQueryResultHolder(fetcher, ids, options?.variables);
        try {
            const queryResult = queryResultHolder.get();
            if (options?.asyncStyle === "ASYNC_OBJECT") {
                return queryResult.loadable as AsyncReturnType<
                    ReadonlyArray<ObjectReference<T, TObjectStyle>>,
                    TAsyncStyle
                >;
            }
            if (queryResult.loadable.loading) {
                throw queryResult.promise; // throws promise, <Suspense/> will catch it
            }
            if (queryResult.loadable.error) {
                throw queryResult.loadable.error;
            }
            if (options?.asyncStyle === "REFRESHABLE_SUSPENSE") {
                return [queryResult.loadable.data] as AsyncReturnType<
                ReadonlyArray<ObjectReference<T, TObjectStyle>>,
                    TAsyncStyle
                >;
            }
            return queryResult.loadable.data as AsyncReturnType<
            ReadonlyArray<ObjectReference<T, TObjectStyle>>,
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
    const [stateValueHolder] = useState(() => new StateValueHolder(stateManager, setStateValueVersion));
    stateValueHolder.set(state, options);
    useEffect(() => {
        return () => {
            stateValueHolder.release();
        }
    }, [stateValueHolder]);
    return stateValueHolder;
}

function useInternalQueryResultHolder(
    fetcher: ObjectFetcher<string, object, object>,
    ids?: ReadonlyArray<any>,
    variables?: any
): QueryResultHolder {

    const stateManager = useStateManager() as StateManagerImpl<any>;
    const [, setQueryResultVersion] = useState(0);
    const [queryResultHolder] = useState(() => new QueryResultHolder(stateManager, setQueryResultVersion));
    queryResultHolder.set(fetcher, ids, variables);
    useEffect(() => {
        return () => {
            queryResultHolder.release();
        }
    }, [queryResultHolder]);
    return queryResultHolder;
}
