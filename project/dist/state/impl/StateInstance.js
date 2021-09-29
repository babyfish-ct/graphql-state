"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateInstance = void 0;
const ComputedStateValue_1 = require("./ComputedStateValue");
const SpaceSavingMap_1 = require("./SpaceSavingMap");
const WritableStateValue_1 = require("./WritableStateValue");
class StateInstance {
    constructor(scopedStateManager, state) {
        this.scopedStateManager = scopedStateManager;
        this.state = state;
        this.valueMap = new SpaceSavingMap_1.SpaceSavingMap();
    }
    retain(variablesCode, variables) {
        const stateValue = this.valueMap.computeIfAbsent(variablesCode, () => this.state[" $stateType"] === "WRITABLE" ?
            new WritableStateValue_1.WritableStateValue(this, variablesCode, variables) :
            new ComputedStateValue_1.ComputedStateValue(this, variablesCode, variables));
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
