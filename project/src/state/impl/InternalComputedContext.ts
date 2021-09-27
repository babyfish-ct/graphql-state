import { State, StateAccessingOptions } from "../State";
import { ComputedStateValue } from "./ComputedStateValue";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValueChangeEvent, StateValueChangeListener } from "./StateManagerImpl";
import { StateValue } from "./StateValue";
import { standardizedVariables } from "./Variables";

export class InternalComputedContext {

    private scope: ScopedStateManager;

    private parent?: InternalComputedContext;

    private dependencies = new Set<StateValue>();

    private closed = false;

    private stateValueChangeListener: StateValueChangeListener;

    constructor(
        parent: InternalComputedContext | ScopedStateManager,
        private currentStateValue: ComputedStateValue
    ) {
        if (parent instanceof InternalComputedContext) {
            this.parent = parent;
            this.scope = parent.scope;
        } else {
            this.scope = parent;
        }
        this.stateValueChangeListener = this.onStateValueChange.bind(this);
        this.scope.stateManager.addStateChangeListener(this.stateValueChangeListener);
    }

    close() {
        if (!this.closed) {
            this.scope.stateManager.removeStateChangeListener(this.stateValueChangeListener);
            this.closed = true;
            let exception = undefined;
            for (const dep of this.dependencies) {
                try {
                    dep.stateInstance.release(dep.variables);
                } catch (ex) {
                    if (exception === undefined) {
                        exception = ex;
                    }
                }
            }
            if (exception !== undefined) {
                throw exception;
            }
        }
    }

    getSelf(options?: StateAccessingOptions<any>): any {
        const variables = standardizedVariables(options?.variables);
        const variablesCode = variables !== undefined ? JSON.stringify(variables) : undefined;
        if (this.currentStateValue.variablesCode === variablesCode) {
            throw new Error("Cannot get the current state with same variables in the computing implementation, please support another variables");
        }
        return this.get(this.currentStateValue.stateInstance.state, options);
    }
    
    get(state: State<any, any>, options?: StateAccessingOptions<any>): any {
        if (this.closed) {
            throw new Error("ComputedContext has been closed");
        }

        const variables = standardizedVariables(options?.variables);
        const variablesCode = variables !== undefined ? JSON.stringify(variables) : undefined;
        const stateInstance = this.scope.instance(state, options?.propagation ?? "REQUIRED");
        const stateValue = stateInstance.retain(variablesCode, variables);

        let result: any;
        try {
            result = this.get0(stateValue);
        } catch (ex) {
            stateInstance.release(variablesCode);
            throw ex;
        }
        
        this.dependencies.add(stateValue);
        return result;
    }

    get0(stateValue: StateValue) {
        for (let ctx: InternalComputedContext | undefined = this; ctx !== undefined; ctx = ctx.parent) {
            if (stateValue === ctx.currentStateValue) {
                throw new Error("Computing circular dependencies");
            }
        }
        if (stateValue instanceof ComputedStateValue) {
            return stateValue.compute(this);
        } else {
            return stateValue.result;
        }
    }

    private onStateValueChange(e: StateValueChangeEvent) {
        if (e.changedType === "RESULT_CHANGE" && this.dependencies.has(e.stateValue)) {
            this.currentStateValue.invalidate();
        }
    }
}