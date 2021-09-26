import { ComputedState, State, StateUnmoutHandler } from "../State";
import { InternalComputedContext } from "./InternalComputedContext";
import { StateInstance } from "./StateInstance";
import { StateValue } from "./StateValue";

export class ComputedStateValue extends StateValue {

    private _unmountHandler?: StateUnmoutHandler;

    private _result: any;

    private _invalid = true;

    private _ctx?: InternalComputedContext;

    constructor(
        stateInstance: StateInstance,
        variablesCode: string | undefined,
        variables: any
    ) {
        super(stateInstance, variablesCode, variables);
    }

    mount() {
        if (this.stateInstance.state[" $stateType"] !== "WRITABLE") {
            const mount = this.stateInstance.state[" $options"]?.mount;
            if (mount !== undefined) {
                const invalidate = this.invalidate.bind(this);
                this._unmountHandler = mount(invalidate);
            }
        }
    }

    umount() {
        try {
            this.freeContext();
        } finally {
            const h = this._unmountHandler;
            if (h !== undefined) {
                this._unmountHandler = undefined;
                h();
            }
        }
    }

    invalidate() {
        if (!this._invalid) {
            this._invalid = true;
            this.stateInstance.scopedStateManager.stateManager.publishStateChangeEvent({
                stateValue: this
            });
        }
    }

    get result(): any {
        return this.compute();
    }

    compute(parentContext?: InternalComputedContext): any {
        if (this._invalid) {
            this._result = this.compute0(parentContext);
            this._invalid = false;
        }
        return this._result;
    }

    private compute0(parentContext?: InternalComputedContext): any {
        const newCtx = new InternalComputedContext(parentContext ?? this.stateInstance.scopedStateManager, this);
        let result: any;
        try {
            result = (this.stateInstance.state as ComputedState<any, any>)[" $valueSupplier"](this.exportContext(newCtx), this.variables);
        } catch (ex) {
            newCtx.close();
            throw ex;
        }
        this.freeContext();
        this._ctx = newCtx;
        return result;
    }

    private freeContext() {
        const ctx = this._ctx;
        if (ctx !== undefined) {
            this._ctx = undefined;
            ctx.close();
        }
    }

    private exportContext(ctx: InternalComputedContext): any {
        let publicContext = contextFunc.bind(ctx);
        publicContext.self = this.stateInstance.state;
        return publicContext;
    }
}

function contextFunc(state: any, options: any): any {
    const ctx = this as InternalComputedContext;
    return ctx.get(state, options);
}