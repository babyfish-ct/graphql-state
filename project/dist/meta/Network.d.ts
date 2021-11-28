import { ObjectFetcher } from "graphql-ts-client-api";
import { SchemaMetadata } from "./impl/SchemaMetadata";
export interface Network {
    execute<T extends object, TVariabes extends object>(fetcher: ObjectFetcher<'Query' | 'Mutation', T, TVariabes>, variables?: TVariabes): Promise<T>;
}
export interface NetworkBuilder {
    build(schema: SchemaMetadata): Network;
}
export declare class GraphQLNetwork {
    private fetch;
    constructor(fetch: (body: string, variables?: object) => Promise<any>);
    execute<TData extends object, TVariabes extends object>(fetcher: ObjectFetcher<'Query' | 'Mutation', TData, TVariabes>, variables?: TVariabes): Promise<TData>;
}
