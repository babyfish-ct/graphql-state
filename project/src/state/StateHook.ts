import { useContext, useEffect, useMemo, useState } from "react";
import { SchemaTypes } from "../meta/SchemaTypes";
import { StateAccessingOptions, State, ParameterizedStateAccessingOptions, SingleWritableState, ParameterizedWritableState, SingleAsyncState, ParameterizedAsyncState, SingleState, ParameterizedState } from "./State";
import { StateManager } from "./StateManager";
import { stateContext } from "./StateManagerProvider";
import { Shape, ObjectTypeOf, variables } from "../meta/Shape";
import { GraphQLFetcher } from "../gql/GraphQLFetcher";
import { StateManagerImpl, StateValueChangeEvent } from "./impl/StateManagerImpl";
import { standardizedVariables } from "./impl/Variables";
import { StateValue } from "./impl/StateValue";
import { WritableStateValue } from "./impl/WritableStateValue";
import { ComputedStateValue } from "./impl/ComputedStateValue";

export function useStateManager<TSchema extends SchemaTypes>(): StateManager<TSchema> {
    const stateManager = useContext(stateContext);
    if (stateManager === undefined) {
        throw new Error("'useStateManager' cannoly be used under <StateManagerProvider/>");
    }
    return stateManager;
}

export function useStateValue<T>(
    state: SingleState<T>,
    options?: StateAccessingOptions
): T;

export function useStateValue<T, TVariables>(
    state: ParameterizedState<T, TVariables>,
    options: ParameterizedStateAccessingOptions<TVariables>
): T;

export function useStateValue<T>(
    state: State<T>,
    options?: StateAccessingOptions
): T {
    const stateValue = useInternalStateValue(state, options);
    if (state[" $stateType"] !== "ASYNC") {
        return stateValue.result;
    }
    const loadable = (stateValue as ComputedStateValue).loadable as UseStateAsyncValueHookResult<T>;
    if (loadable.loading) {
        throw stateValue.result; // throws promise, <Suspense/> will catch it
    }
    if (loadable.error) {
        throw loadable.error;
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

export function useStateAsyncValue<T>(
    state: SingleAsyncState<T>,
    options?: StateAccessingOptions
): UseStateAsyncValueHookResult<T>;

export function useStateAsyncValue<T, TVariables>(
    state: ParameterizedAsyncState<T, TVariables>,
    options: ParameterizedStateAccessingOptions<TVariables>
): UseStateAsyncValueHookResult<T>;

export function useStateAsyncValue<T>(
    state: SingleAsyncState<T> | ParameterizedAsyncState<T, any>,
    options?: StateAccessingOptions
): UseStateAsyncValueHookResult<T> {
    const stateValue = useInternalStateValue(state, options);
    return (stateValue as ComputedStateValue).loadable as UseStateAsyncValueHookResult<T>;
}

export function makeManagedObjectHooks<TSchema extends SchemaTypes>(): ManagedObjectHooks<TSchema> {
    throw new Error();
}

export interface StateAccessor<T> {
    (): T;
    (value: T): void;
}

export interface ManagedObjectHooks<TSchema extends SchemaTypes> {

    useManagedObject<
        TTypeName extends keyof TSchema,
        TShape extends Shape<TSchema[TTypeName]>
    >(
        typeName: TTypeName,
        options: {
            readonly id: any,
            readonly shape: TShape
        }
    ): UseStateAsyncValueHookResult<ObjectTypeOf<TSchema[TTypeName], TShape> | undefined>;

    useManagedObjects<
        TTypeName extends keyof TSchema,
        TShape extends Shape<TSchema[TTypeName]>
    >(
        typeName: TTypeName,
        options: {
            ids: readonly any[],
            shape: TShape
        }
    ): UseStateAsyncValueHookResult<ReadonlyArray<ObjectTypeOf<TSchema[TTypeName], TShape> | undefined>>;

    useManagedObject<
        TTypeName extends keyof TSchema & Exclude<string, "Query" | "Mutation">,
        TData extends object,
        TVariables extends object
    >(
        typeName: TTypeName,
        options: {
            readonly id: any,
            readonly fetcher: GraphQLFetcher<TTypeName, TData, TVariables>,
            readonly variables?: TVariables
        }
    ): UseStateAsyncValueHookResult<ObjectTypeOf<TSchema[TTypeName], TData> | undefined>;

    useManagedObjects<
        TTypeName extends keyof TSchema & Exclude<string, "Query" | "Mutation">,
        TData extends object,
        TVariables extends object
    >(
        typeName: TTypeName,
        options: {
            readonly ids: readonly any[],
            readonly fetcher: GraphQLFetcher<TTypeName, TData, TVariables>,
            readonly variables?: TVariables
        }
    ): UseStateAsyncValueHookResult<ObjectTypeOf<TSchema[TTypeName], TData> | undefined>;
}

export interface UseStateAsyncValueHookResult<T> {
    readonly data: T;
    readonly loading: boolean;
    readonly error?: Error;
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
        stateManager.addStateChangeListener(stateValueChange);
        return () => {
            stateManager.removeStateChangeListener(stateValueChange);
        }
    }, [stateManager, stateValue]);

    return stateValue;
}
