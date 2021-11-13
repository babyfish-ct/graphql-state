import { VariableArgs } from "./Args";
import { StateInstance } from "./StateInstance";
import { Loadable, StateValue } from "./StateValue";

export class WritableStateValue extends StateValue {

    private _lodable: Loadable = {
        loading: false
    };

    readonly accessor = access.bind(this);
    
    constructor(
        stateInstance: StateInstance, 
        args: VariableArgs | undefined,
        disposer: () => void
    ) {
        super(stateInstance, args, disposer);
        const defaultValue = this.stateInstance.state[" $defaultValue"];
        this._lodable = { 
            ...this._lodable,
            data: stateInstance.state[" $parameterized"] && typeof defaultValue === "function" ? 
                defaultValue(args?.variables ?? {}) : 
                defaultValue 
        };
    }

    get result(): any {
        return this._lodable.data;
    }

    get loadable(): Loadable {
        return this._lodable;
    }

    data(data: any) {
        const oldData = this._lodable.data;
        if (oldData !== data) {
            this._lodable = { 
                ...this._lodable,
                data 
            }
            this.stateInstance.scopedStateManager.stateManager.publishStateValueChangeEvent({
                stateValue: this,
                changedType: "RESULT_CHANGE"
            });
        }
    }

    protected createMountContext(): any {
        const clonedFun = this.accessor.bind({});
        clonedFun.stateManager = this.stateInstance.scopedStateManager.stateManager;
        return clonedFun;
    }
}

function access(...args: any[]): any {
    const stateValue = this as WritableStateValue;
    if (args.length === 0) {
        return stateValue.result;
    } else {
        stateValue.data(args[0]);
    }
}
