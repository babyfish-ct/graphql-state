import { Fetcher } from "graphql-ts-client-api";
import { State, StateAccessingOptions } from "../State";
import { ComputedStateValue } from "./ComputedStateValue";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValue } from "./StateValue";
export declare class InternalComputedContext {
    private currentStateValue;
    private scope;
    private parent?;
    private dependencies;
    private closed;
    private stateValueChangeListener;
    constructor(parent: InternalComputedContext | ScopedStateManager, currentStateValue: ComputedStateValue);
    close(): void;
    getSelf(options?: StateAccessingOptions): any;
    get(state: State<any>, options?: StateAccessingOptions): any;
    get0(stateValue: StateValue): any;
    object(fetcher: Fetcher<string, object, object>, id: any, variables?: any): Promise<any>;
    private onStateValueChange;
}
