import { useContext } from "react";
import { SchemaTypes } from "../meta/SchemaTypes";
import { AsyncResult, AsyncResultType, AsyncState, AsyncStateOptions, BaseState, BaseStateOptions, ComputedState, ComputedStateOptions } from "./State";
import { StateManager } from "./StateManager";
import { stateContext } from "./StateManagerProvider";
import { Shape, ObjectTypeOf } from "../meta/Shape";
import { GraphQLFetcher } from "../gql/GraphQLFetcher";

export function useStateManager<TSchema extends SchemaTypes>(): StateManager<TSchema> {
    const stateManager = useContext(stateContext);
    if (stateManager === undefined) {
        throw new Error("'useStateManager' cannoly be used under <StateManagerProvider/>");
    }
    return stateManager;
}

export function useStateValue<T>(
    state: BaseState<T>,
    options: BaseStateOptions
): T;

export function useStateValue<T, TVariables>(
    state: ComputedState<T, TVariables>,
    options: ComputedStateOptions<TVariables>
): T;

export function useStateValue<T, TVariables, TAsyncResultType extends AsyncResultType = "PROMISE">(
    state: AsyncState<T, TVariables>,
    options: AsyncStateOptions<TVariables, TAsyncResultType>
): AsyncResult<T, TAsyncResultType>;

export function useStateValue(
    state: any,
    options: any
): any {
    throw new Error();
}

export function useStateAccessor<T>(
    state: BaseState<T>,
    options: BaseStateOptions
): BaseStateAccessor<T>;

export function useStateAccessor<T, TVariables>(
    state: ComputedState<T, TVariables>,
    options: ComputedStateOptions<TVariables>
): ComputedStateAccessor<T, TVariables>;

export function useStateAccessor<T, TVariables, TAsyncResultType extends AsyncResultType = "PROMISE">(
    state: AsyncState<T, TVariables>,
    options: AsyncStateOptions<TVariables, TAsyncResultType>
): AsyncComputedStateAccessor<T, TVariables>;

export function useStateAccessor(
    state: any,
    options: any
): any {
    throw new Error();
}

export function makeManagedObjectHooks<TSchema extends SchemaTypes>(): ManagedObjectHooks<TSchema> {
    throw new Error();
}

export interface BaseStateAccessor<T> {
    (): T;
    (value: T): void;
    (valueSupplier: (oldValue: T) => T);
}

export interface ComputedStateAccessor<T, TVariables> {
    (variables: TVariables): T;
}

export interface AsyncComputedStateAccessor<T, TVariables> {
    (variables: TVariables): Promise<T>;
}

export interface AsyncComputedStateResultAccessor<T, TVariables, TAsyncResultType extends AsyncResultType> {
    (variables: TVariables): AsyncResult<T, TAsyncResultType>;
}

export interface ManagedObjectHooks<TSchema extends SchemaTypes> {

    useManagedObject<
        TTypeName extends keyof TSchema,
        TShape extends Shape<TSchema[TTypeName]>,
        TAsyncResultType extends AsyncResultType = "PROMISE"
    >(
        typeName: TTypeName,
        options: {
            readonly id: any,
            readonly shape: TShape,
            readonly resultType?: TAsyncResultType
        }
    ): AsyncResult<ObjectTypeOf<TSchema[TTypeName], TShape> | undefined, TAsyncResultType>;

    useManagedObjects<
        TTypeName extends keyof TSchema,
        TShape extends Shape<TSchema[TTypeName]>,
        TAsyncResultType extends AsyncResultType = "PROMISE"
    >(
        typeName: TTypeName,
        options: {
            ids: readonly any[],
            shape: TShape,
            readonly resultType?: TAsyncResultType
        }
    ): AsyncResult<ReadonlyArray<ObjectTypeOf<TSchema[TTypeName], TShape> | undefined>, TAsyncResultType>;

    useManagedObject<
        TTypeName extends keyof TSchema & Exclude<string, "Query" | "Mutation">,
        TData extends object,
        TVariables extends object,
        TAsyncResultType extends AsyncResultType = "PROMISE"
    >(
        typeName: TTypeName,
        options: {
            readonly id: any,
            readonly fetcher: GraphQLFetcher<TTypeName, TData, TVariables>,
            readonly variables?: TVariables,
            readonly resultType?: TAsyncResultType
        }
    ): AsyncResult<ObjectTypeOf<TSchema[TTypeName], TData> | undefined, TAsyncResultType>;

    useManagedObjects<
        TTypeName extends keyof TSchema & Exclude<string, "Query" | "Mutation">,
        TData extends object,
        TVariables extends object,
        TAsyncResultType extends AsyncResultType = "PROMISE"
    >(
        typeName: TTypeName,
        options: {
            readonly ids: readonly any[],
            readonly fetcher: GraphQLFetcher<TTypeName, TData, TVariables>,
            readonly variables?: TVariables,
            readonly resultType?: TAsyncResultType
        }
    ): AsyncResult<ObjectTypeOf<TSchema[TTypeName], TData> | undefined, TAsyncResultType>;
}