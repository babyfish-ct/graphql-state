export interface StateAccessingOptions {
    readonly scope?: StateAccessingScope;
}
export declare type StateAccessingScope = "auto" | "local";
export interface ParameterizedStateAccessingOptions<TVariables> extends StateAccessingOptions {
    readonly variables: TVariables;
}
export interface ReleasePolicyOptions<TVariables extends object> {
    readonly releasePolicy?: ReleasePolicy<TVariables>;
}
export interface AsyncOptions<TAsyncStyle extends AsyncStyle = "suspense", TVariables extends object = {}> extends ReleasePolicyOptions<TVariables> {
    readonly asyncStyle?: TAsyncStyle;
}
export declare type AsyncStyle = "suspense" | "refetchable-suspense" | "async-object";
export declare type ReleasePolicy<TVariables extends object> = (aliveTime: number, variables?: TVariables) => number;
export interface QueryOptions<TVariables extends object> {
    readonly variables?: TVariables;
    readonly mode?: QueryMode;
}
export declare type QueryMode = "cache-and-network" | "cache-only";
export interface PaginationQueryOptions<TVariables extends object> extends QueryOptions<TVariables> {
    readonly windowId: string;
    readonly initialSize: number;
    readonly pageSize?: number;
    readonly paginiationStyle?: PaginationStyle;
}
export declare type PaginationStyle = "forward" | "backward" | "page";
export interface ObjectQueryOptions<TVariables extends object, TObjectStyle extends ObjectStyle> extends QueryOptions<TVariables> {
    readonly objectStyle: TObjectStyle;
}
export declare type ObjectStyle = "required" | "optional";
export interface MutationOptions<T, TVariables extends object> {
    readonly variables?: TVariables;
    readonly onSuccess?: (data: T) => void;
    readonly onError?: (error: any) => void;
    readonly onCompelete?: (data: T | undefined, error: any) => void;
}
export interface StateAccessor<T> {
    (): T;
    (value: T): void;
}
export declare type UseStateAsyncValueHookResult<T> = {
    readonly data?: T;
    readonly loading: boolean;
    readonly error?: Error;
    readonly refetch: () => void;
};
export declare type AsyncReturnType<T, TAsyncStyle extends AsyncStyle> = TAsyncStyle extends "async-object" ? UseStateAsyncValueHookResult<T> : TAsyncStyle extends "refetchable-suspense" ? {
    readonly data: T;
    readonly refetch: () => void;
} : T;
export declare type AsyncPaginationReturnType<T, TAsyncStyle extends AsyncStyle> = (TAsyncStyle extends "async-object" ? {
    readonly loading: boolean;
    readonly error: any;
    readonly data?: T;
} : {
    readonly data: T;
}) & (TAsyncStyle extends "suspense" ? {} : {
    readonly refetch: () => void;
}) & {
    readonly loadNext: () => void;
    readonly loadPrevious: () => void;
    readonly hasNext: boolean;
    readonly hasPrevious: boolean;
    readonly isLoadingNext: boolean;
    readonly isLoadingPrevious: boolean;
};
export declare type ObjectReference<T, TObjectStyle extends ObjectStyle> = TObjectStyle extends "required" ? T : T | undefined;
export interface MutationReturnType<T extends object, TVariables extends object> {
    readonly mutate: (variables?: TVariables) => Promise<T>;
    readonly data?: T;
    readonly loading: boolean;
    readonly error: any;
}
