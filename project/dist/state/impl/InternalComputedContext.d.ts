import { ObjectFetcher } from "graphql-ts-client-api";
import { State } from "../State";
import { ObjectQueryOptions, QueryOptions, StateAccessingOptions } from "../Types";
import { ComputedStateValue } from "./ComputedStateValue";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValue } from "./StateValue";
export declare class InternalComputedContext {
    private currentStateValue;
    private scope;
    private parent?;
    private stateValueDependencies;
    private queryResultDependencies;
    private closed;
    private stateValueChangeListener;
    private queryResultChangeListener;
    constructor(parent: InternalComputedContext | ScopedStateManager, currentStateValue: ComputedStateValue);
    close(): void;
    getSelf(options?: StateAccessingOptions): any;
    get(state: State<any>, options?: StateAccessingOptions): any;
    get0(stateValue: StateValue): any;
    object(fetcher: ObjectFetcher<string, object, object>, id: any, options?: ObjectQueryOptions<any, any, any>): Promise<any>;
    objects(fetcher: ObjectFetcher<string, object, object>, ids: ReadonlyArray<any>, options?: ObjectQueryOptions<any, any, any>): Promise<ReadonlyArray<any>>;
    query(fetcher: ObjectFetcher<"Query", object, object>, options?: QueryOptions<any, any>): Promise<any>;
    private queryImpl;
    private onStateValueChange;
    private onQueryResultChange;
}
