export interface GraphQLFetcher<TTypeName extends string, TData extends object, TVariables extends object> {

    readonly " $isGraphQLFetcher": true;
    " $supressWarnings"(_1: TTypeName, _2: TData, _3: TVariables): void;
}