/*
 * Input types
 */
export interface StateAccessingOptions {
    readonly scope?: StateAccessingScope;
}
export type StateAccessingScope = "auto" | "local";

export interface ParameterizedStateAccessingOptions<TVariables> extends StateAccessingOptions {
    readonly variables: TVariables;
}

export interface AsyncOptions<TAsyncStyle extends AsyncStyle = "suspense"> {
    readonly asyncStyle?: TAsyncStyle;
    readonly releasePolicy?: ReleasePolicy;
}
export type AsyncStyle = "suspense" | "refetchable-suspense" | "async-object";
export type ReleasePolicy = (aliveTime: number) => number;

export interface QueryOptions<TVariables extends object, TAsyncStyle extends AsyncStyle> {
    readonly asyncStyle?: TAsyncStyle
    readonly variables?: TVariables;
    readonly mode?: QueryMode;
    readonly releasePolicy?: ReleasePolicy;
}
export type QueryMode = "cache-and-network" | "cache-only";

export interface PaginationQueryOptions<
    TVariables extends object, 
    TAsyncStyle extends AsyncStyle
> extends QueryOptions<TVariables, TAsyncStyle> {
    readonly windowId: string,
    readonly initialSize: number;
    readonly pageSize?: number;
    readonly paginiationStyle?: PaginationStyle
}
export type PaginationStyle = "forward" | "backward" | "page";

export interface ObjectQueryOptions<
    TVariables extends object, 
    TAsyncStyle extends AsyncStyle, 
    TObjectStyle extends ObjectStyle
> extends QueryOptions<TVariables, TAsyncStyle> {
    readonly objectStyle: TObjectStyle;
}
export type ObjectStyle = "required" | "optional";

export interface MutationOptions<T, TVariables extends object> {
    readonly variables?: TVariables;
    readonly onSuccess?: (data: T) => void;
    readonly onError?: (error: any) => void;
    readonly onCompelete?: (data: T | undefined, error: any) => void;
}

/*
 * Output types
 */
export interface StateAccessor<T> {
    (): T;
    (value: T): void;
}

export type UseStateAsyncValueHookResult<T> = {
    readonly data?: T;
    readonly loading: boolean;
    readonly error?: Error;
    readonly refetch: () => void;
};

export type AsyncReturnType<T, TAsyncStyle extends AsyncStyle> =
    TAsyncStyle extends "async-object" ?
    UseStateAsyncValueHookResult<T> :
    TAsyncStyle extends "refetchable-suspense" ?
    { readonly data: T, readonly refetch: () => void} :
    T
;

export type AsyncPaginationReturnType<T, TAsyncStyle extends AsyncStyle> =
    (
        TAsyncStyle extends "async-object" ? {
            readonly loading: boolean,
            readonly error: any,
            readonly data?: T,
        } : {
            readonly data: T,
        }
    ) &
    (
        TAsyncStyle extends "suspense" ? {
        } : {
            readonly refetch: () => void
        }
    ) &
    {  
        readonly loadNext: () => void,
        readonly loadPrevious: () => void,
        readonly hasNext: boolean,
        readonly hasPrevious: boolean,
        readonly isLoadingNext: boolean,
        readonly isLoadingPrevious: boolean
    }
;

export type ObjectReference<T, TObjectStyle extends ObjectStyle> = TObjectStyle extends "required" ? T : T | undefined;


export interface MutationReturnType<T extends object, TVariables extends object> {
    readonly mutate: (variables?: TVariables) => Promise<T>;
    readonly data?: T;
    readonly loading: boolean;
    readonly error: any;
}