import { InternalComputedContext } from "./InternalComputedContext";
import { StateInstance } from "./StateInstance";
import { Loadable, StateValue } from "./StateValue";
export declare class ComputedStateValue extends StateValue {
    private _unmountHandler?;
    private _result;
    private _loadable;
    private _invalid;
    private _ctx?;
    constructor(stateInstance: StateInstance, variablesCode: string | undefined, variables: any);
    mount(): void;
    umount(): void;
    invalidate(): void;
    get result(): any;
    get loadable(): Loadable;
    compute(parentContext?: InternalComputedContext): any;
    private compute0;
    private freeContext;
    private exportContext;
    private get isAsync();
    private beforeCompute;
    private afterCompute;
}
