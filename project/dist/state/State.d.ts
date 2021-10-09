import { Fetcher } from "graphql-ts-client-api";
import { SchemaType } from "../meta/SchemaType";
export declare function makeStateFactory<TSchema extends SchemaType = {}>(): StateFactory<TSchema>;
export interface StateFactory<TSchema extends SchemaType> {
    createState<T>(defaultValue: T, options?: WritableStateCreationOptions<T>): SingleWritableState<T>;
    createParameterizedState<T, TVariables>(defaultValue: T | ((variables: TVariables) => T), options?: WritableStateCreationOptions<T>): ParameterizedWritableState<T, TVariables>;
    createComputedState<T>(valueSupplier: (ctx: ComputedContext<TSchema>) => T, options?: ComputedStateCreationOptions): SingleComputedState<T>;
    createParameterizedComputedState<T, TVariables>(valueSupplier: (ctx: ParameterizedComputedContext<TSchema, T, TVariables>, variables: TVariables) => T, options?: ComputedStateCreationOptions): ParameterizedComputedState<T, TVariables>;
    createAsyncState<T>(valueSupplier: (ctx: ComputedContext<TSchema>) => Promise<T>, options?: ComputedStateCreationOptions): SingleAsyncState<T>;
    createParameterizedAsyncState<T, TVariables>(valueSupplier: (ctx: ParameterizedAsyncContext<TSchema, T, TVariables>, variables: TVariables) => Promise<T>, options?: ComputedStateCreationOptions): ParameterizedAsyncState<T, TVariables>;
}
export declare type State<T> = SingleState<T> | ParameterizedState<T, any>;
export declare type SingleState<T> = SingleWritableState<T> | SingleComputedState<T> | SingleAsyncState<T>;
export declare type ParameterizedState<T, TVariables> = ParameterizedWritableState<T, TVariables> | ParameterizedComputedState<T, TVariables> | ParameterizedAsyncState<T, TVariables>;
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
    <X>(state: SingleWritableState<X> | SingleComputedState<X>, options?: StateAccessingOptions): X;
    <X, XVariables>(state: ParameterizedWritableState<X, XVariables> | ParameterizedComputedState<X, XVariables>, options: ParameterizedStateAccessingOptions<XVariables>): X;
    <X>(state: SingleAsyncState<X>, options: StateAccessingOptions): Promise<X>;
    <X, XVariables>(state: ParameterizedState<X, XVariables>, options: ParameterizedStateAccessingOptions<XVariables>): Promise<X>;
    object<TName extends Exclude<keyof TSchema & string, "Query" | "Mutation">, T extends object, TVaraibles extends object>(fetcher: Fetcher<TName, T, TVaraibles>, id: TSchema[TName][" $id"], variables?: TVaraibles): Promise<T | undefined>;
    query<T extends object, TVaraibles extends object>(fetcher: Fetcher<"Query", T, TVaraibles>, variables?: TVaraibles): Promise<T | undefined>;
}
export interface ParameterizedComputedContext<TSchema extends SchemaType, T, TVariables> extends ComputedContext<TSchema> {
    self(options: ParameterizedStateAccessingOptions<TVariables>): T;
}
export interface ParameterizedAsyncContext<TSchema extends SchemaType, T, TVariables> extends ComputedContext<TSchema> {
    self(options: ParameterizedStateAccessingOptions<TVariables>): Promise<T>;
}
export declare type StatePropagation = "REQUIRED" | "REQUIRES_NEW" | "MANDATORY";
export interface StateCreationOptions {
    readonly mode?: StateScopeMode;
}
export interface WritableStateCreationOptions<T> extends StateCreationOptions {
    readonly mount?: (ctx: WritableStateCreationgContext<T>) => StateUnmoutHandler | undefined | void;
}
export interface ComputedStateCreationOptions extends StateCreationOptions {
    readonly mount?: (ctx: {
        invalidate: () => void;
    }) => StateUnmoutHandler | undefined | void;
}
export interface WritableStateCreationgContext<T> {
    (): T;
    (value: T): void;
}
export declare type StateUnmoutHandler = () => void;
export declare type StateScopeMode = "GLOBAL_SCOPE_ONLY" | "NESTED_SCOPE_ONLY" | "ANY_SCOPE";
export interface StateAccessingOptions {
    readonly propagation?: StatePropagation;
}
export interface ParameterizedStateAccessingOptions<TVariables> extends StateAccessingOptions {
    readonly variables: TVariables;
}
