import { useContext, useEffect, useMemo } from "react";
import { SchemaTypes } from "../meta/SchemaTypes";
import { AsyncState, ComputedState, WriteableState, StateAccessingOptions, State } from "./State";
import { StateManager } from "./StateManager";
import { stateContext } from "./StateManagerProvider";
import { Shape, ObjectTypeOf, variables } from "../meta/Shape";
import { GraphQLFetcher } from "../gql/GraphQLFetcher";
import { StateManagerImpl } from "./impl/StateManagerImpl";
import { standardizedVariables } from "./impl/Variables";
import { StateValue } from "./impl/StateValue";

export function useStateManager<TSchema extends SchemaTypes>(): StateManager<TSchema> {
    const stateManager = useContext(stateContext);
    if (stateManager === undefined) {
        throw new Error("'useStateManager' cannoly be used under <StateManagerProvider/>");
    }
    return stateManager;
}

export function useStateValue<T, TVariables>(
    state: WriteableState<T, TVariables> | ComputedState<T, TVariables>,
    options: StateAccessingOptions<TVariables>
): T {
    const stateValue = useInternalStateValue(state, options);
    throw new Error();
}

export function useStateWriter<T, TVariables>(
    state: WriteableState<T, TVariables>,
    options: StateAccessingOptions<TVariables>
): StateWriter<T> {
    throw new Error();
}

export function useStateAsyncValue<T, TVariables>(
    state: AsyncState<T, TVariables>,
    options: StateAccessingOptions<TVariables>
): UseStateAsyncValueHookResult<T> {
    const stateValue = useInternalStateValue(state, options);
    throw new Error();
}

export function makeManagedObjectHooks<TSchema extends SchemaTypes>(): ManagedObjectHooks<TSchema> {
    throw new Error();
}

export interface StateWriter<T> {
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
    state: State<any, any>,
    options: StateAccessingOptions<any>
): StateValue {

    const stateManager = useStateManager() as StateManagerImpl<any>;
    const stateInstance = stateManager.scope.instance(state, options?.propagation ?? "REQUIRED");

    const [vs, vsKey] = useMemo<[any, string | undefined]>(() => { 
        const variables = standardizedVariables(options?.variables);
        return [variables, variables !== undefined ? JSON.stringify(variables) : undefined]
    }, [options?.variables]);

    useEffect(() => {
        stateInstance.retain(vsKey, vs);
        return () => {
            stateInstance.release(vsKey);
        }
    }, [stateInstance, vsKey]);

    return stateInstance.get(variables);
}