import { StateInstance } from "./StateInstance";
import { StateValue } from "./StateValue";

export class WritableStateValue extends StateValue {

    private _result: any;

    readonly accessor = access.bind(this);
    
    constructor(
        stateInstance: StateInstance, 
        variables: any
    ) {
        super(stateInstance, variables);
        const defaultValue = this.stateInstance.state[" $defaultValue"];
        this._result = typeof defaultValue === "function" ? defaultValue(variables ?? {}) : defaultValue;
    }

    get result(): any {
        return this._result;
    }

    set result(result: any) {
        const oldResult = this._result;
        if (oldResult !== result) {
            this._result = result;
            this.stateInstance.scopedStateManager.stateManager.publishStateChangeEvent({
                stateValue: this,
                oldResult,
                newResult: result
            });
        }
    }
}

function access(...args: any[]): any {
    const stateValue = this as WritableStateValue;
    if (args.length === 0) {
        return stateValue.result;
    } else {
        stateValue.result = args[0];
    }
}