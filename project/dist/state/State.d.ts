import { GraphQLFetcher } from "../gql/GraphQLFetcher";
import { SchemaTypes } from "../meta/SchemaTypes";
import { ObjectTypeOf, Shape } from "../meta/Shape";
export declare function createState<T>(value: T): BaseState<T>;
export declare function makeComputedStateCreators<TSchema extends SchemaTypes>(): {
    readonly createComputedState: <T, TVariables>(supplier: (ctx: ComputedContext<TSchema>, variables: TVariables) => T) => ComputedState<T, TVariables>;
    readonly createAsyncState: <T, TVariables>(supplier: (ctx: ComputedContext<TSchema>, variables: TVariables) => Promise<T>) => AsyncState<T, TVariables>;
};
export interface BaseState<T> {
    " $supressWarnings"(_1: T): void;
    " $stateType": "basic";
}
export interface ComputedState<T, TVariables> {
    " $supressWarnings"(_1: T, _2: TVariables): void;
    " $stateType": "computed";
}
export interface AsyncState<T, TVariables> {
    " $supressWarnings"(_1: T, _2: TVariables): void;
    " $stateType": "async";
}
export interface ComputedContext<TSchema extends SchemaTypes> {
    <T>(state: BaseState<T>, options?: BaseStateOptions): T;
    <T, TVariables>(state: ComputedState<T, TVariables>, options?: ComputedStateOptions<TVariables>): T;
    <T, TVariables, TAsyncResultType extends AsyncResultType = "PROMISE">(state: AsyncState<T, TVariables>, options: AsyncStateOptions<TVariables, TAsyncResultType>): AsyncResult<T, TAsyncResultType>;
    managedObject<TTypeName extends keyof TSchema, TShape extends Shape<TSchema[TTypeName]>, TAsyncResultType extends AsyncResultType = "PROMISE">(typeName: TTypeName, options: {
        readonly id: any;
        readonly shape: TShape;
        readonly resultType?: TAsyncResultType;
    }): AsyncResult<ObjectTypeOf<TSchema[TTypeName], TShape> | undefined, TAsyncResultType>;
    managedObjects<TTypeName extends keyof TSchema, TShape extends Shape<TSchema[TTypeName]>, TAsyncResultType extends AsyncResultType = "PROMISE">(typeName: TTypeName, options: {
        ids: readonly any[];
        shape: TShape;
        readonly resultType?: TAsyncResultType;
    }): AsyncResult<ReadonlyArray<ObjectTypeOf<TSchema[TTypeName], TShape> | undefined>, TAsyncResultType>;
    managedObject<TTypeName extends keyof TSchema & Exclude<string, "Query" | "Mutation">, TData extends object, TVariables extends object, TAsyncResultType extends AsyncResultType = "PROMISE">(typeName: TTypeName, options: {
        readonly id: any;
        readonly fetcher: GraphQLFetcher<TTypeName, TData, TVariables>;
        readonly variables?: TVariables;
        readonly resultType?: TAsyncResultType;
    }): AsyncResult<ObjectTypeOf<TSchema[TTypeName], TData> | undefined, TAsyncResultType>;
    managedObjects<TTypeName extends keyof TSchema & Exclude<string, "Query" | "Mutation">, TData extends object, TVariables extends object, TAsyncResultType extends AsyncResultType = "PROMISE">(typeName: TTypeName, options: {
        readonly ids: readonly any[];
        readonly fetcher: GraphQLFetcher<TTypeName, TData, TVariables>;
        readonly variables?: TVariables;
        readonly resultType?: TAsyncResultType;
    }): AsyncResult<ObjectTypeOf<TSchema[TTypeName], TData> | undefined, TAsyncResultType>;
}
export interface BaseStateOptions {
    readonly globalScope?: boolean;
}
export interface ComputedStateOptions<TVariables> extends BaseStateOptions {
    readonly variables?: TVariables;
}
export interface AsyncStateOptions<TVariables, TAsyncResultType extends AsyncResultType> extends ComputedStateOptions<TVariables> {
    readonly resultType: TAsyncResultType;
}
export declare type AsyncResultType = "PROMISE" | "TUPLE";
export declare type AsyncResult<T, TAsyncResultType extends AsyncResultType> = TAsyncResultType extends "PROMISE" ? Promise<T> : {
    readonly data?: T;
    readonly loading?: T;
    readonly error?: Error;
};
