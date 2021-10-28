import { State } from "../State";
import { VariableArgs } from "./Args";
import { ComputedStateValue } from "./ComputedStateValue";
import { ScopedStateManager } from "./ScopedStateManager";
import { SpaceSavingMap } from "./SpaceSavingMap";
import { StateValue } from "./StateValue";
import { WritableStateValue } from "./WritableStateValue";

export class StateInstance {

    private valueMap = new SpaceSavingMap<string | undefined, StateValue>();

    constructor(
        readonly scopedStateManager: ScopedStateManager,
        readonly state: State<any>
    ) {

    }

    retain(args: VariableArgs | undefined): StateValue {
        const stateValue = this.valueMap.computeIfAbsent(
            args?.key, 
            () => this.state[" $stateType"] === "WRITABLE" ?
                new WritableStateValue(this, args, () => { this.valueMap.remove(args?.key)}) :
                new ComputedStateValue(this, args, () => { this.valueMap.remove(args?.key)})
        );
        return stateValue.retain();
    }

    release(args: VariableArgs | undefined) {
        this.valueMap.get(args?.key)?.release(60000);
    }

    dispose() {
        const values: StateValue[] = [];
        this.valueMap.forEachValue(value => { values.push(value) });
        let exception: any = undefined;
        for (const value of values) {
            try {
                value.dispose(false);
            } catch (ex) {
                if (ex === undefined) {
                    exception = ex;
                }
            }
        }
        if (exception !== undefined) {
            throw exception;
        }
    }
}