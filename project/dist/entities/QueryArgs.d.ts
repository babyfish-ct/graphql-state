import { ObjectFetcher } from "graphql-ts-client-api";
import { OptionArgs } from "../state/impl/Args";
import { RuntimeShape } from "./RuntimeShape";
export declare class QueryArgs {
    readonly shape: RuntimeShape;
    readonly fetcher: ObjectFetcher<string, object, object>;
    readonly ids: ReadonlyArray<any> | undefined;
    readonly optionsArgs?: OptionArgs | undefined;
    private _key;
    private constructor();
    get key(): string;
    static create(fetcher: ObjectFetcher<string, object, object>, ids?: ReadonlyArray<any>, optionArgs?: OptionArgs): QueryArgs;
    newArgs(ids: ReadonlyArray<any>): QueryArgs;
    contains(args: QueryArgs): boolean;
}
