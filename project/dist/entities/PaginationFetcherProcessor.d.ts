import { ObjectFetcher } from "graphql-ts-client-api";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
export declare class PaginationFetcherProcessor {
    private schema;
    constructor(schema: SchemaMetadata);
    process(fetcher: ObjectFetcher<string, object, object>): [string, string | undefined, ObjectFetcher<string, object, object>];
    private findConnectionField;
    private adjustConnection;
    private adjustPageInfo;
}
export declare const GRAPHQL_STATE_PAGINATION_INFO: string;
export declare const GRAPHQL_STATE_FIRST: string;
export declare const GRAPHQL_STATE_AFTER: string;
export declare const GRAPHQL_STATE_LAST: string;
export declare const GRAPHQL_STATE_BEFORE: string;
