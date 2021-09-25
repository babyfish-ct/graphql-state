import { State } from "../State";
import { SpaceSavingMap } from "./SpaceSavingMap";
import { StateValue } from "./StateValue";

export class StateInstance {

    private valueMap = new SpaceSavingMap<string | undefined, StateValue>();

    constructor(private state: State<any, any>) {

    }

    get(variables: any) {
        const stateValue = this.valueMap.get(variables);
        if (stateValue === undefined) {
            throw new Error("Internal bug");
        }
        return stateValue;
    }

    retain(variablesCode: string | undefined, variables: any): StateValue {
        const stateValue = this.valueMap.computeIfAbsent(
            variablesCode, 
            () => new StateValue(this.state, variables)
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