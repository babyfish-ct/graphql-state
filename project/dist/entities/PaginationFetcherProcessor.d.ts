import { ObjectFetcher } from "graphql-ts-client-api";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
export declare class PaginationFetcherProcessor {
    private schema;
    constructor(schema: SchemaMetadata);
    process(fetcher: ObjectFetcher<string, object, object>): [string, ObjectFetcher<string, object, object>];
    private findConnectionField;
    private adjustConnection;
    private adjustPageInfo;
}
export declare const GRAPHQL_STATE_WINDOW_ID = "graphql_state_window_id__";
export declare const GRAPHQL_STATE_FIRST = "graphql_state_first__";
export declare const GRAPHQL_STATE_AFTER = "graphql_state_after__";
export declare const GRAPHQL_STATE_LAST = "graphql_state_last__";
export declare const GRAPHQL_STATE_BEFORE = "graphql_state_before__";
