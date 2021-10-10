import { Fetcher } from "graphql-ts-client-api";
import { SchemaType } from "../meta/SchemaType";

export function makeStateFactory<TSchema extends SchemaType = {}>(): StateFactory<TSchema> {
    return new StateFactoryImpl<TSchema>();
}

export interface StateFactory<TSchema extends SchemaType> {

    createState<T>(
        defaultValue: T,
        options?: WritableStateCreationOptions<T>
    ): SingleWritableState<T>;

    createParameterizedState<T, TVariables>(
        defaultValue: T | ((variables: TVariables) => T),
        options?: WritableStateCreationOptions<T>
    ): ParameterizedWritableState<T, TVariables>;

    createComputedState<T>(
        valueSupplier: (ctx: ComputedContext<TSchema>) => T,
        options?: ComputedStateCreationOptions
    ): SingleComputedState<T>;

    createParameterizedComputedState<T, TVariables>(
        valueSupplier: (ctx: ParameterizedComputedContext<TSchema, T, TVariables>, variables: TVariables) => T,
        options?: ComputedStateCreationOptions
    ): ParameterizedComputedState<T, TVariables>;
    
    createAsyncState<T>( 
        valueSupplier: (ctx: ComputedContext<TSchema>) => Promise<T>,
        options?: ComputedStateCreationOptions
    ): SingleAsyncState<T>;

    createParameterizedAsyncState<T, TVariables>( 
        valueSupplier: (ctx: ParameterizedAsyncContext<TSchema, T, TVariables>, variables: TVariables) => Promise<T>,
        options?: ComputedStateCreationOptions
    ): ParameterizedAsyncState<T, TVariables>;
}

export type State<T> = SingleState<T> | ParameterizedState<T, any>;

export type SingleState<T> = SingleWritableState<T> | SingleComputedState<T> | SingleAsyncState<T>;

export type ParameterizedState<T, TVariables> = 
    ParameterizedWritableState<T, TVariables> |
    ParameterizedComputedState<T, TVariables> |
    ParameterizedAsyncState<T, TVariables>;

export interface SingleWritableState<T> {

    readonly " $stateType": "WRITABLE";
    readonly " $parameterized": false;

    readonly " $defaultValue": T;
    readonly " $options"?: StateCreationOptions;
    " $supressWarnings"(_: T): void;
}

export interface ParameterizedWritableState<T, TVariables> {

    readonly " $stateType": "WRITABLE";
    readonly " $parameterized": true;

    readonly " $defaultValue": T | ((variables: TVariables) => T);
    readonly " $options"?: StateCreationOptions;
    " $supressWarnings"(_1: T, _2: TVariables): void;
} 

export interface SingleComputedState<T> {

    readonly " $stateType": "COMPUTED";
    readonly " $parameterized": false;

    readonly " $valueSupplier": (ctx: ComputedContext<any>) => T;
    readonly " $options"?: ComputedStateCreationOptions;
    " $supressWarnings"(_: T): void;
}

export interface ParameterizedComputedState<T, TVariables> {

    readonly " $stateType": "COMPUTED";
    readonly " $parameterized": true;

    readonly " $valueSupplier": (ctx: ComputedContext<any>, variables: TVariables) => T;
    readonly " $options"?: ComputedStateCreationOptions;
    " $supressWarnings"(_1: T, _2: TVariables): void;
}

export interface SingleAsyncState<T> {

    readonly " $stateType": "ASYNC";
    readonly " $parameterized": false;
    
    readonly " $valueSupplier": (ctx: ComputedContext<any>) => Promise<T>;
    readonly " $options"?: ComputedStateCreationOptions;
    " $supressWarnings"(_: T): void;
}

export interface ParameterizedAsyncState<T, TVariables> {

    readonly " $stateType": "ASYNC";
    readonly " $parameterized": true;
    
    readonly " $valueSupplier": (ctx: ComputedContext<any>, variables: TVariables) => Promise<T>;
    readonly " $options"?: ComputedStateCreationOptions;
    " $supressWarnings"(_1: T, _2: TVariables): void;
}

export interface ComputedContext<TSchema extends SchemaType> {
    
    <X>(
        state: SingleWritableState<X> | SingleComputedState<X>, 
        options?: StateAccessingOptions
    ): X;

    <X, XVariables>(
        state: ParameterizedWritableState<X, XVariables> | ParameterizedComputedState<X, XVariables>, 
        options: ParameterizedStateAccessingOptions<XVariables>
    ): X;

    <X>(
        state: SingleAsyncState<X>, 
        options: StateAccessingOptions
    ): Promise<X>;
    
    <X, XVariables>(
        state: ParameterizedState<X, XVariables>, 
        options: ParameterizedStateAccessingOptions<XVariables>
    ): Promise<X>;

    object<
        TName extends Exclude<keyof TSchema & string, "Query" | "Mutation">,
        T extends object,
        TVaraibles extends object
    >(
        fetcher: Fetcher<TName, T, TVaraibles>,
        id: TSchema[TName][" $id"],
        variables?: TVaraibles
    ): Promise<T | undefined>;

    objects<
        TName extends Exclude<keyof TSchema & string, "Query" | "Mutation">,
        T extends object,
        TVaraibles extends object
    >(
        fetcher: Fetcher<TName, T, TVaraibles>,
        ids: ReadonlyArray<TSchema[TName][" $id"]>,
        variables?: TVaraibles
    ): Promise<ReadonlyArray<T | undefined>>;

    query<
        T extends object,
        TVaraibles extends object
    >(
        fetcher: Fetcher<"Query", T, TVaraibles>,
        variables?: TVaraibles
    ): Promise<T>;
}

export interface ParameterizedComputedContext<
    TSchema extends SchemaType,
    T,
    TVariables
> extends ComputedContext<TSchema> {
    
    self(
        options: ParameterizedStateAccessingOptions<TVariables>
    ): T;
}

export interface ParameterizedAsyncContext<
    TSchema extends SchemaType,
    T,
    TVariables
> extends ComputedContext<TSchema> {
    
    self(
        options: ParameterizedStateAccessingOptions<TVariables>
    ): Promise<T>;
}

export type StatePropagation = "REQUIRED" | "REQUIRES_NEW" | "MANDATORY";

class StateFactoryImpl<TSchema extends SchemaType> implements StateFactory<TSchema> {

    createState<T>(
        defaultValue: T,
        options?: StateCreationOptions
    ): SingleWritableState<T> {
        return {
            " $stateType": "WRITABLE",
            " $parameterized": false,
            " $defaultValue": defaultValue,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }

    createParameterizedState<T, TVariables>(
        defaultValue: T | ((variables: TVariables) => T),
        options?: StateCreationOptions
    ): ParameterizedWritableState<T, TVariables> {
        return {
            " $stateType": "WRITABLE",
            " $parameterized": true,
            " $defaultValue": defaultValue,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }

    createComputedState<T>(
        valueSupplier: (ctx: ComputedContext<TSchema>) => T,
        options?: ComputedStateCreationOptions
    ): SingleComputedState<T> {
        return {
            " $stateType": "COMPUTED",
            " $parameterized": false,
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }

    createParameterizedComputedState<T, TVariables>(
        valueSupplier: (ctx: ParameterizedComputedContext<TSchema, T, TVariables>, variables: TVariables) => T,
        options?: ComputedStateCreationOptions
    ): ParameterizedComputedState<T, TVariables> {
        return {
            " $stateType": "COMPUTED",
            " $parameterized": true,
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    
    createAsyncState<T>( 
        valueSupplier: (ctx: ComputedContext<TSchema>) => Promise<T>,
        options?: ComputedStateCreationOptions
    ): SingleAsyncState<T> {
        return {
            " $stateType": "ASYNC",
            " $parameterized": false,
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }

    createParameterizedAsyncState<T, TVariables>( 
        valueSupplier: (ctx: ParameterizedAsyncContext<TSchema, T, TVariables>, variables: TVariables) => Promise<T>,
        options?: ComputedStateCreationOptions
    ): ParameterizedAsyncState<T, TVariables> {
        return {
            " $stateType": "ASYNC",
            " $parameterized": true,
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
}

export interface StateCreationOptions {
    readonly mode?: StateScopeMode;
}

export interface WritableStateCreationOptions<T> extends StateCreationOptions {
    readonly mount?: (ctx: WritableStateCreationgContext<T>) => StateUnmoutHandler | undefined | void;
}

export interface ComputedStateCreationOptions extends StateCreationOptions {
    readonly mount?: (ctx: {
        invalidate: () => void
    }) => StateUnmoutHandler | undefined | void;
}

export interface WritableStateCreationgContext<T> {
    (): T;
    (value: T): void;
}

export type StateUnmoutHandler = () => void;

export type StateScopeMode = "GLOBAL_SCOPE_ONLY" | "NESTED_SCOPE_ONLY" | "ANY_SCOPE"; 

export interface StateAccessingOptions {
    readonly propagation?: StatePropagation;
}

export interface ParameterizedStateAccessingOptions<TVariables> extends StateAccessingOptions {
    readonly variables: TVariables;
}

function unsupportedOperation() {
    throw new Error("UnsupportedOperationException");
}
