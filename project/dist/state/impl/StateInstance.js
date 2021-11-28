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
    retain(args) {
        const stateValue = this.valueMap.computeIfAbsent(args === null || args === void 0 ? void 0 : args.key, () => this.state[" $stateType"] === "WRITABLE" ?
            new WritableStateValue_1.WritableStateValue(this, args, () => { this.valueMap.remove(args === null || args === void 0 ? void 0 : args.key); }) :
            new ComputedStateValue_1.ComputedStateValue(this, args, () => { this.valueMap.remove(args === null || args === void 0 ? void 0 : args.key); }));
        return stateValue.retain();
    }
    release(args, releasePolicy) {
        var _a;
        (_a = this.valueMap.get(args === null || args === void 0 ? void 0 : args.key)) === null || _a === void 0 ? void 0 : _a.release(releasePolicy);
    }
    dispose() {
        const values = [];
        this.valueMap.forEachValue(value => { values.push(value); });
        let exception = undefined;
        for (const value of values) {
            try {
                value.dispose(false);
            }
            catch (ex) {
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
exports.StateInstance = StateInstance;
