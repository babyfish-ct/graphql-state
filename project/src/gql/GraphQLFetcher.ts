export interface GraphQLFetcher<TTypeName extends string, TData extends object, TVariables extends object> {

    " $supressWarnings"(_1: TTypeName, _2: TData, _3: TVariables): void;
    readonly " $isGrapqlFetcher": true;
}