import { GraphQLFetcher } from "../gql/GraphQLFetcher";
import { SchemaTypes } from "../meta/SchemaTypes";
import { ObjectTypeOf, Shape } from "../meta/Shape";

export function makeStateFactory<TSchema extends SchemaTypes = {}>(): StateFactory<TSchema> {
    return new StateFactoryImpl<TSchema>();
}

export interface StateFactory<TSchema extends SchemaTypes> {

    createState<T, TVariables = {}>(
        defaultValue: T | ((variables: TVariables) => T),
        options?: StateCreationOptions
    ): WriteableState<T, TVariables>;

    createComputedState<T, TVariables = {}>(
        valueSupplier: (ctx: ComputedContext<TSchema>, variables: TVariables) => T,
        options?: ComputedStateCreationOptions
    ): ComputedState<T, TVariables>;
    
    createAsyncState<T, TVariables = {}>( 
        valueSupplier: (ctx: ComputedContext<TSchema>, variables: TVariables) => Promise<T>,
        options?: ComputedStateCreationOptions
    ): AsyncState<T, TVariables>;
}

export type State<T, TVariables> = WriteableState<T, TVariables> | ComputedState<T, TVariables> | AsyncState<T, TVariables>;

export interface WriteableState<T, TVariables> {

    readonly " $stateType": "WRITABLE";

    readonly " $defaultValue": T | ((variables: TVariables) => T);
    readonly " $options"?: StateCreationOptions;
    " $supressWarnings"(_1: T, _2: TVariables): void;
}

export interface ComputedState<T, TVariables> {

    readonly " $stateType": "COMPUTED";

    readonly " $valueSupplier": (ctx: ComputedContext<any>, variables: TVariables) => T;
    readonly " $options"?: ComputedStateCreationOptions;
    " $supressWarnings"(_1: T, _2: TVariables): void;
}

export interface AsyncState<T, TVariables> {

    readonly " $stateType": "ASYNC";
    
    readonly " $valueSupplier": (ctx: ComputedContext<any>, variables: TVariables) => Promise<T>;
    readonly " $options"?: ComputedStateCreationOptions;
    " $supressWarnings"(_1: T, _2: TVariables): void;
}

export interface StateCreationOptions {
    readonly mode?: StateScopeMode;
}

export interface ComputedStateCreationOptions extends StateCreationOptions {
    readonly mount?: (invalidate: () => void) => StateUnmoutHandler | undefined;
}

export type StateUnmoutHandler = () => void;

export type StateScopeMode = "GLOBAL_SCOPE_ONLY" | "NESTED_SCOPE_ONLY" | "ANY_SCOPE"; 




export interface ComputedContext<TSchema extends SchemaTypes> {
    
    <T, TVariables>(
        state: WriteableState<T, TVariables> | ComputedState<T, TVariables>, 
        options?: StateAccessingOptions<TVariables>
    ): T;
    
    <T, TVariables>(
        state: AsyncState<T, TVariables>, 
        options: StateAccessingOptions<TVariables>
    ): Promise<T>;

    managedObject<
        TTypeName extends keyof TSchema,
        TShape extends Shape<TSchema[TTypeName]>
    >(
        typeName: TTypeName,
        options: {
            readonly id: any,
            readonly shape: TShape
        }
    ): Promise<ObjectTypeOf<TSchema[TTypeName], TShape> | undefined>;

    managedObjects<
        TTypeName extends keyof TSchema,
        TShape extends Shape<TSchema[TTypeName]>
    >(
        typeName: TTypeName,
        options: {
            ids: readonly any[],
            shape: TShape
        }
    ): Promise<ReadonlyArray<ObjectTypeOf<TSchema[TTypeName], TShape> | undefined>>;

    managedObject<
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
    ): Promise<ObjectTypeOf<TSchema[TTypeName], TData> | undefined>;

    managedObjects<
        TTypeName extends keyof TSchema & Exclude<string, "Query" | "Mutation">,
        TData extends object,
        TVariables extends object
    >(
        typeName: TTypeName,
        options: {
            readonly ids: readonly any[],
            readonly fetcher: GraphQLFetcher<TTypeName, TData, TVariables>,
            readonly variables?: TVariables,
        }
    ): Promise<ReadonlyArray<ObjectTypeOf<TSchema[TTypeName], TData> | undefined>>;
}

export interface StateAccessingOptions<TVariables> {
    readonly variables?: TVariables;
    readonly propagation?: StatePropagation;
}

export type StatePropagation = "REQUIRED" | "REQUIRES_NEW" | "MANDATORY";

class StateFactoryImpl<TSchema extends SchemaTypes> implements StateFactory<TSchema> {

    createState<T, TVariables = {}>(
        defaultValue: T | ((variables: TVariables) => T),
        options?: StateCreationOptions
    ): WriteableState<T, TVariables> {
        return {
            " $stateType": "WRITABLE",
            " $defaultValue": defaultValue,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }

    createComputedState<T, TVariables = {}>(
        valueSupplier: (ctx: ComputedContext<TSchema>, variables: TVariables) => T,
        options?: ComputedStateCreationOptions
    ): ComputedState<T, TVariables> {
        return {
            " $stateType": "COMPUTED",
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    
    createAsyncState<T, TVariables = {}>( 
        valueSupplier: (ctx: ComputedContext<TSchema>, variables: TVariables) => Promise<T>,
        options?: ComputedStateCreationOptions
    ): AsyncState<T, TVariables> {
        return {
            " $stateType": "ASYNC",
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
}

function unsupportedOperation() {
    throw new Error("UnsupportedOperationException");
}