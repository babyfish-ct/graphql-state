import { StateInstance } from "./StateInstance";
import { Loadable, StateValue } from "./StateValue";

export class WritableStateValue extends StateValue {

    private _lodable: Loadable = {
        loading: false
    };

    readonly accessor = access.bind(this);
    
    constructor(
        stateInstance: StateInstance, 
        variablesCode: string | undefined,
        variables: any
    ) {
        super(stateInstance, variablesCode, variables);
        const defaultValue = this.stateInstance.state[" $defaultValue"];
        this._lodable = { 
            ...this._lodable,
            data: stateInstance.state[" $parameterized"] && typeof defaultValue === "function" ? 
                defaultValue(variables ?? {}) : 
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
}

function access(...args: any[]): any {
    const stateValue = this as WritableStateValue;
    if (args.length === 0) {
        return stateValue.result;
    } else {
        stateValue.data(args[0]);
    }
}