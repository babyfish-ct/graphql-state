import { GraphQLFetcher } from "../gql/GraphQLFetcher";
import { EntityManager } from "./EntityManager";
export declare class QueryContext {
    private entityMangager;
    constructor(entityMangager: EntityManager);
    queryObjectByShape(typeName: string, id: any, shape: any, options?: {}): Promise<any>;
    queryObjectByFetcher(id: any, fetcher: GraphQLFetcher<string, any, any>, options?: {
        readonly variables: any;
    }): Promise<any>;
    queryByFetcher(fetcher: GraphQLFetcher<string, any, any>, options?: {
        readonly variables: any;
    }): Promise<any>;
    private findObjectByShape;
}
