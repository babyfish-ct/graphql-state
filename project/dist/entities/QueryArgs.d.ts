import { ObjectFetcher } from "graphql-ts-client-api";
import { RuntimeShape } from "./RuntimeShape";
export declare class QueryArgs {
    readonly shape: RuntimeShape;
    readonly fetcher: ObjectFetcher<string, object, object>;
    readonly ids?: readonly any[] | undefined;
    readonly variables?: any;
    private _key;
    private constructor();
    get key(): string;
    static create(fetcher: ObjectFetcher<string, object, object>, ids?: ReadonlyArray<any>, variables?: any): QueryArgs;
    newArgs(ids: ReadonlyArray<any>): QueryArgs;
    contains(args: QueryArgs): boolean;
}
