"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateInstance = void 0;
const SpaceSavingMap_1 = require("./SpaceSavingMap");
const StateValue_1 = require("./StateValue");
class StateInstance {
    constructor(state) {
        this.state = state;
        this.valueMap = new SpaceSavingMap_1.SpaceSavingMap();
    }
    get(variables) {
        const stateValue = this.valueMap.get(variables);
        if (stateValue === undefined) {
            throw new Error("Internal bug");
        }
        return stateValue;
    }
    retain(variablesCode, variables) {
        const stateValue = this.valueMap.computeIfAbsent(variablesCode, () => new StateValue_1.StateValue(this.state, variables));
        if (stateValue.retain()) {
            stateValue.mount();
        }
        return stateValue;
    }
    release(variablesCode) {
        const stateValue = this.valueMap.get(variablesCode);
        if (stateValue !== undefined && stateValue.release()) {
            try {
                stateValue.umount();
            }
            finally {
                this.valueMap.remove(variablesCode);
            }
        }
    }
}
exports.StateInstance = StateInstance;
