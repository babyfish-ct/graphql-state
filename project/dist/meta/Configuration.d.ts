import { ObjectFetcher } from "graphql-ts-client-api";
import { StateManager } from "../state/StateManager";
import { SchemaType } from "./SchemaType";
export interface Configuration<TSchema extends SchemaType> {
    bidirectionalAssociation<TTypeName extends keyof TSchema & string, TMappedByFieldName extends keyof TSchema[TTypeName][" $associations"] & string, TOppositeFieldName extends keyof TSchema[TSchema[TTypeName][" $associations"][TMappedByFieldName]][" $associations"] & string>(typeName: TTypeName, mappedByFieldName: TMappedByFieldName, oppositeFieldName: TOppositeFieldName): this;
    network(network: Network): this;
    buildStateManager(): StateManager<TSchema>;
}
export interface Network {
    execute<T extends object, TVariabes extends object>(fetcher: ObjectFetcher<'Query' | 'Mutation', T, TVariabes>, variables?: TVariabes): Promise<T>;
}
export declare class GraphQLNetwork {
    private fetch;
    constructor(fetch: (body: string, variables?: object) => Promise<any>);
    execute<TData extends object, TVariabes extends object>(fetcher: ObjectFetcher<'Query' | 'Mutation', TData, TVariabes>, variables?: TVariabes): Promise<TData>;
}
