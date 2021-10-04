import { Fetcher } from "graphql-ts-client-api";
import { EntityManager } from "./EntityManager";
export declare class QueryContext {
    private entityMangager;
    constructor(entityMangager: EntityManager);
    queryObject(fetcher: Fetcher<string, object, object>, id: any, variables?: object): Promise<any>;
    private findObject;
}
