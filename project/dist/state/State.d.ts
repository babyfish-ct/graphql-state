import { Fetcher } from "graphql-ts-client-api";
import { EmptySchemaType, SchemaType } from "../meta/SchemaType";
import { ObjectQueryOptions, ObjectReference, ObjectStyle, ParameterizedStateAccessingOptions, QueryOptions, ReleasePolicyOptions, StateAccessingOptions } from "./Types";
export declare function makeStateFactory<TSchema extends SchemaType = EmptySchemaType>(): StateFactory<TSchema>;
export interface StateFactory<TSchema extends SchemaType> {
    createState<T>(name: string, defaultValue: T, options?: WritableStateCreationOptions<T>): SingleWritableState<T>;
    createParameterizedState<T, TVariables>(name: string, defaultValue: T | ((variables: TVariables) => T), options?: WritableStateCreationOptions<T>): ParameterizedWritableState<T, TVariables>;
    createComputedState<T>(name: string, valueSupplier: (ctx: ComputedContext<TSchema>) => T, options?: ComputedStateCreationOptions): SingleComputedState<T>;
    createParameterizedComputedState<T, TVariables>(name: string, valueSupplier: (ctx: ParameterizedComputedContext<TSchema, T, TVariables>, variables: TVariables) => T, options?: ComputedStateCreationOptions): ParameterizedComputedState<T, TVariables>;
    createAsyncState<T>(name: string, valueSupplier: (ctx: ComputedContext<TSchema>) => Promise<T>, options?: ComputedStateCreationOptions): SingleAsyncState<T>;
    createParameterizedAsyncState<T, TVariables>(name: string, valueSupplier: (ctx: ParameterizedAsyncContext<TSchema, T, TVariables>, variables: TVariables) => Promise<T>, options?: ComputedStateCreationOptions): ParameterizedAsyncState<T, TVariables>;
}
export declare type State<T> = SingleState<T> | ParameterizedState<T, any>;
export declare type SingleState<T> = SingleWritableState<T> | SingleComputedState<T> | SingleAsyncState<T>;
export declare type ParameterizedState<T, TVariables> = ParameterizedWritableState<T, TVariables> | ParameterizedComputedState<T, TVariables> | ParameterizedAsyncState<T, TVariables>;
export interface SingleWritableState<T> {
    readonly " $name": string;
    readonly " $stateType": "WRITABLE";
    readonly " $parameterized": false;
    readonly " $defaultValue": T;
    readonly " $options"?: StateCreationOptions;
    " $supressWarnings"(_: T): void;
}
export interface ParameterizedWritableState<T, TVariables> {
    readonly " $name": string;
    readonly " $stateType": "WRITABLE";
    readonly " $parameterized": true;
    readonly " $defaultValue": T | ((variables: TVariables) => T);
    readonly " $options"?: StateCreationOptions;
    " $supressWarnings"(_1: T, _2: TVariables): void;
}
export interface SingleComputedState<T> {
    readonly " $name": string;
    readonly " $stateType": "COMPUTED";
    readonly " $parameterized": false;
    readonly " $valueSupplier": (ctx: ComputedContext<any>) => T;
    readonly " $options"?: ComputedStateCreationOptions;
    " $supressWarnings"(_: T): void;
}
export interface ParameterizedComputedState<T, TVariables> {
    readonly " $name": string;
    readonly " $stateType": "COMPUTED";
    readonly " $parameterized": true;
    readonly " $valueSupplier": (ctx: ComputedContext<any>, variables: TVariables) => T;
    readonly " $options"?: ComputedStateCreationOptions;
    " $supressWarnings"(_1: T, _2: TVariables): void;
}
export interface SingleAsyncState<T> {
    readonly " $name": string;
    readonly " $stateType": "ASYNC";
    readonly " $parameterized": false;
    readonly " $valueSupplier": (ctx: ComputedContext<any>) => Promise<T>;
    readonly " $options"?: ComputedStateCreationOptions;
    " $supressWarnings"(_: T): void;
}
export interface ParameterizedAsyncState<T, TVariables> {
    readonly " $name": string;
    readonly " $stateType": "ASYNC";
    readonly " $parameterized": true;
    readonly " $valueSupplier": (ctx: ComputedContext<any>, variables: TVariables) => Promise<T>;
    readonly " $options"?: ComputedStateCreationOptions;
    " $supressWarnings"(_1: T, _2: TVariables): void;
}
export interface ComputedContext<TSchema extends SchemaType> {
    <T>(state: SingleWritableState<T> | SingleComputedState<T>, options?: StateAccessingOptions): T;
    <T, TVariables extends object>(state: ParameterizedWritableState<T, TVariables> | ParameterizedComputedState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables>): T;
    <T>(state: SingleAsyncState<T>, options: StateAccessingOptions & ReleasePolicyOptions<any>): Promise<T>;
    <T, TVariables extends object>(state: ParameterizedState<T, TVariables>, options: ParameterizedStateAccessingOptions<TVariables> & ReleasePolicyOptions<TVariables>): Promise<T>;
    query<T extends object, TVaraibles extends object>(fetcher: Fetcher<"Query", T, TVaraibles>, options?: QueryOptions<TVaraibles> & ReleasePolicyOptions<TVaraibles>): Promise<T>;
    object<TName extends TSchema["entities"] & string, T extends object, TVaraibles extends object, TObjectStyle extends ObjectStyle = "required">(fetcher: Fetcher<TName, T, TVaraibles>, id: TSchema["entities"][TName][" $id"], options?: ObjectQueryOptions<TVaraibles, TObjectStyle> & ReleasePolicyOptions<TVaraibles>): Promise<ObjectReference<T, TObjectStyle>>;
    objects<TName extends TSchema["entities"] & string, T extends object, TVaraibles extends object, TObjectStyle extends ObjectStyle = "required">(fetcher: Fetcher<TName, T, TVaraibles>, ids: ReadonlyArray<TSchema["entities"][TName][" $id"]>, options?: ObjectQueryOptions<TVaraibles, TObjectStyle> & ReleasePolicyOptions<TVaraibles>): Promise<ReadonlyArray<T | undefined>>;
}
export interface ParameterizedComputedContext<TSchema extends SchemaType, T, TVariables> extends ComputedContext<TSchema> {
    self(options: ParameterizedStateAccessingOptions<TVariables>): T;
}
export interface ParameterizedAsyncContext<TSchema extends SchemaType, T, TVariables> extends ComputedContext<TSchema> {
    self(options: ParameterizedStateAccessingOptions<TVariables>): Promise<T>;
}
export interface StateCreationOptions {
    readonly scope?: StateCreationScope;
}
export interface WritableStateCreationOptions<T> extends StateCreationOptions {
    readonly mount?: (ctx: WritableStateCreatingContext<T>) => StateUnmoutHandler | undefined | void;
}
export interface ComputedStateCreationOptions extends StateCreationOptions {
    readonly mount?: (ctx: ComputedStateCreatingContext) => StateUnmoutHandler | undefined | void;
}
export interface WritableStateCreatingContext<T> {
    (): T;
    (value: T): void;
}
export interface ComputedStateCreatingContext extends StateCreationOptions {
    invalidate(): void;
}
export declare type StateUnmoutHandler = () => void;
export declare type StateCreationScope = "global-scope-only" | "any-scope";
