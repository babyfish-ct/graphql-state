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
        const stateValue = this.valueMap.get(args?.key);
        stateValue?.release(60000);
    }
}