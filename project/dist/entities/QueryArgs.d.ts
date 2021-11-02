import { ObjectFetcher } from "graphql-ts-client-api";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { OptionArgs } from "../state/impl/Args";
import { RuntimeShape } from "./RuntimeShape";
export declare class QueryArgs {
    readonly shape: RuntimeShape;
    readonly fetcher: ObjectFetcher<string, object, object>;
    readonly pagination: {
        readonly windowId: string;
        readonly connName: string;
    } | undefined;
    readonly ids: ReadonlyArray<any> | undefined;
    readonly optionArgs: OptionArgs | undefined;
    private _key;
    private _hasWindowId;
    private _withWindowId?;
    private _withoutWindowId?;
    private constructor();
    get key(): string;
    static create(fetcher: ObjectFetcher<string, object, object>, pagination?: {
        readonly windowId: string;
        readonly schema: SchemaMetadata;
    }, ids?: ReadonlyArray<any>, optionArgs?: OptionArgs): QueryArgs;
    newArgs(ids: ReadonlyArray<any>): QueryArgs;
    contains(args: QueryArgs): boolean;
    variables(variables: any): QueryArgs;
    withWindowId(): QueryArgs;
    withoutWindowId(): QueryArgs;
}
