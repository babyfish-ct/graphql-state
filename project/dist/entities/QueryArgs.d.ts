import { ObjectFetcher } from "graphql-ts-client-api";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { OptionArgs } from "../state/impl/Args";
import { PaginationStyle } from "../state/StateHook";
import { RuntimeShape } from "./RuntimeShape";
export declare class QueryArgs {
    readonly shape: RuntimeShape;
    readonly fetcher: ObjectFetcher<string, object, object>;
    readonly pagination: {
        readonly windowId: string;
        readonly connName: string;
        readonly style: PaginationStyle;
        readonly initialSize: number;
        readonly pageSize: number;
    } | undefined;
    readonly ids: ReadonlyArray<any> | undefined;
    readonly optionArgs: OptionArgs | undefined;
    private _key;
    private _hasPaginationInfo;
    private _withPaginationInfo?;
    private _withoutPaginationInfo?;
    private constructor();
    get key(): string;
    static create(fetcher: ObjectFetcher<string, object, object>, schemaForPagination?: SchemaMetadata, ids?: ReadonlyArray<any>, optionArgs?: OptionArgs): QueryArgs;
    newArgs(ids: ReadonlyArray<any>): QueryArgs;
    contains(args: QueryArgs): boolean;
    variables(variables: any): QueryArgs;
    withPaginationInfo(): QueryArgs;
    withoutPaginationInfo(): QueryArgs;
}
