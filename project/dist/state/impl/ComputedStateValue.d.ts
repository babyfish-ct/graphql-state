import { VariableArgs } from "../../entities/VariableArgs";
import { InternalComputedContext } from "./InternalComputedContext";
import { StateInstance } from "./StateInstance";
import { Loadable, StateValue } from "./StateValue";
export declare class ComputedStateValue extends StateValue {
    private _result;
    private _loadable;
    private _invalid;
    private _ctx?;
    private currentAsyncRequestId;
    constructor(stateInstance: StateInstance, args: VariableArgs | undefined, disposer: () => void);
    invalidate(): void;
    get result(): any;
    get loadable(): Loadable;
    compute(parentContext?: InternalComputedContext): any;
    protected createMountContext(): any;
    private compute0;
    protected onUnmount(): void;
    private freeContext;
    private exportContext;
    private get isAsync();
    private beforeCompute;
    private afterCompute;
}
