import { StateUnmoutHandler } from "../State";
import { StateInstance } from "./StateInstance";
import { StateValue } from "./StateValue";

export class ComputedStateValue extends StateValue {

    private _unmountHandler?: StateUnmoutHandler;

    constructor(
        stateInstance: StateInstance,
        variables: any
    ) {
        super(stateInstance, variables);
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
        const h = this._unmountHandler;
        if (h !== undefined) {
            this._unmountHandler = undefined;
            h();
        }
    }

    invalidate() {
    }

    get result(): any {
        return undefined;
    }
}