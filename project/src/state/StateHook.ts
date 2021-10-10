import { useContext, useEffect, useMemo, useState } from "react";
import { StateAccessingOptions, State, ParameterizedStateAccessingOptions, SingleWritableState, ParameterizedWritableState, SingleAsyncState, ParameterizedAsyncState, SingleState, ParameterizedState, SingleComputedState, ParameterizedComputedState } from "./State";
import { StateManager } from "./StateManager";
import { stateContext } from "./StateManagerProvider";
import { QueryResultChangeEvent, StateManagerImpl, StateValueChangeEvent } from "./impl/StateManagerImpl";
import { standardizedVariables } from "./impl/Variables";
import { StateValue } from "./impl/StateValue";
import { WritableStateValue } from "./impl/WritableStateValue";
import { ComputedStateValue } from "./impl/ComputedStateValue";
import { SchemaType } from "../meta/SchemaType";
import { Fetcher } from "graphql-ts-client-api";
import { QueryArgs, QueryResult } from "../entities/QueryResult";

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
    const stateValue = useInternalStateValue(state, options);
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
    const stateValue = useInternalStateValue(state, options);
    return (stateValue as WritableStateValue).accessor;
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

export function makeManagedObjectHooks<TSchema extends SchemaType>(): ManagedObjectHooks<TSchema> {
    return new ManagedObjectHooksImpl<TSchema>();
}

export interface ManagedObjectHooks<TSchema extends SchemaType> {

    useObject<
        TName extends keyof TSchema & string,
        T extends object,
        TVariables extends object
    >(
        fetcher: Fetcher<string, T, TVariables>,
        id: TSchema[TName][" $id"],
        variables?: TVariables
    ): UseStateAsyncValueHookResult<T | undefined>;

    useObjects<
        TName extends keyof TSchema & string,
        T extends object,
        TVariables extends object
    >(
        fetcher: Fetcher<string, T, TVariables>,
        ids: ReadonlyArray<TSchema[TName][" $id"]>,
        variables?: TVariables
    ): UseStateAsyncValueHookResult<ReadonlyArray<T | undefined>>;

    useQuery<
        T extends object,
        TVaraibles extends object
    >(
        fetcher: Fetcher<"Query", T, TVaraibles>,
        variables?: TVaraibles
    ): UseStateAsyncValueHookResult<T>;
}

function useInternalStateValue(
    state: State<any>,
    options?: StateAccessingOptions
): StateValue {

    const stateManager = useStateManager() as StateManagerImpl<any>;
    const stateInstance = stateManager.scope.instance(state, options?.propagation ?? "REQUIRED");

    const [vs, vsKey] = useMemo<[any, string | undefined]>(() => { 
        const svs = standardizedVariables((options as Partial<ParameterizedStateAccessingOptions<any>>)?.variables);
        return [svs, svs !== undefined ? JSON.stringify(svs) : undefined]
    }, [(options as Partial<ParameterizedStateAccessingOptions<any>>)?.variables]);

    const [, setStateVerion] = useState(0);

    const stateValue = useMemo<StateValue>(() => {
        return stateInstance.retain(vsKey, vs); 
    }, [vsKey, vs]);
    useEffect(() => {
        return () => {
            stateInstance.release(vsKey);
        }
    }, [stateInstance, vsKey]);

    useEffect(() => {
        const stateValueChange = (e: StateValueChangeEvent) => {
            if (e.stateValue === stateValue) {
                setStateVerion(old => old + 1); // Change a local state to update react component
            }
        };
        stateManager.addStateValueChangeListener(stateValueChange);
        return () => {
            stateManager.removeStateValueChangeListener(stateValueChange);
        }
    }, [stateManager, stateValue]);

    return stateValue;
}

class ManagedObjectHooksImpl<TSchema extends SchemaType> implements ManagedObjectHooks<TSchema> {

    useObject<
        TName extends keyof TSchema & string,
        T extends object,
        TVariables extends object
    >(
        fetcher: Fetcher<string, T, TVariables>,
        id: TSchema[TName][" $id"],
        variables?: TVariables
    ): UseStateAsyncValueHookResult<T | undefined> {
        return useInternalQueryResult(fetcher, id, variables).loadable as UseStateAsyncValueHookResult<T | undefined>;
    }

    useObjects<
        TName extends keyof TSchema & string,
        T extends object,
        TVariables extends object
    >(
        fetcher: Fetcher<string, T, TVariables>,
        ids: ReadonlyArray<TSchema[TName][" $id"]>,
        variables?: TVariables
    ): UseStateAsyncValueHookResult<ReadonlyArray<T | undefined>> {
        throw new Error("Unsupported");
    }

    useQuery<
        T extends object,
        TVaraibles extends object
    >(
        fetcher: Fetcher<"Query", T, TVaraibles>,
        variables?: TVaraibles
    ): UseStateAsyncValueHookResult<T> {
        throw new Error("Unsupported");
    }
}

function useInternalQueryResult(
    fetcher: Fetcher<string, object, object>,
    id?: any,
    variables?: any
): QueryResult {

    const stateManager = useStateManager() as StateManagerImpl<any>;
    const entityManager = stateManager.entityManager;

    const queryArgs = useMemo<QueryArgs>(() => {
        return new QueryArgs(fetcher, id, variables);
    }, [fetcher, id, variables]);

    const [, setQueryVersion] = useState(0);

    const queryResult = useMemo<QueryResult>(() => {
        return entityManager.retain(queryArgs);
    }, [queryArgs.shape.toString()]);

    useEffect(() => {
        return () => {
            entityManager.release(queryArgs);
        };
    }, [entityManager, queryArgs.shape.toString()]);

    useEffect(() => {
        const queryResultChange = (e: QueryResultChangeEvent) => {
            if (e.queryResult === queryResult) {
                setQueryVersion(old => old + 1); // Change a local state to update react component
            }
        };
        stateManager.addQueryResultChangeListener(queryResultChange);
        return () => {
            stateManager.removeQueryResultChangeListener(queryResultChange);
        }
    }, [stateManager, queryResult]);

    return queryResult;
}
