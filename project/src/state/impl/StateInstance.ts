import { State } from "../State";
import { ComputedStateValue } from "./ComputedStateValue";
import { ScopedStateManager } from "./ScopedStateManager";
import { SpaceSavingMap } from "./SpaceSavingMap";
import { StateValue } from "./StateValue";
import { WritableStateValue } from "./WritableStateValue";

export class StateInstance {

    private valueMap = new SpaceSavingMap<string | undefined, StateValue>();

    constructor(
        readonly scopedStateManager: ScopedStateManager,
        readonly state: State<any, any>
    ) {

    }

    retain(variablesCode: string | undefined, variables: any): StateValue {
        const stateValue = this.valueMap.computeIfAbsent(
            variablesCode, 
            () => this.state[" $stateType"] === "WRITABLE" ?
                new WritableStateValue(this, variables) :
                new ComputedStateValue(this, variables)
        );
        if (stateValue.retain()) {
            stateValue.mount();
        }
        return stateValue;
    }

    release(variablesCode: string | undefined) {
        const stateValue = this.valueMap.get(variablesCode);
        if (stateValue !== undefined && stateValue.release()) {
            try {
                stateValue.umount();
            } finally {
                this.valueMap.remove(variablesCode);
            }
        }
    }
}