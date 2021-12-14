"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateInstance = void 0;
const Monitor_1 = require("../Monitor");
const ComputedStateValue_1 = require("./ComputedStateValue");
const SpaceSavingMap_1 = require("./SpaceSavingMap");
const util_1 = require("./util");
const WritableStateValue_1 = require("./WritableStateValue");
class StateInstance {
    constructor(scopedStateManager, state) {
        this.scopedStateManager = scopedStateManager;
        this.state = state;
        this.valueMap = new SpaceSavingMap_1.SpaceSavingMap();
    }
    retain(args) {
        const stateValue = this.valueMap.computeIfAbsent(args === null || args === void 0 ? void 0 : args.key, () => {
            const disposer = () => {
                this.valueMap.remove(args === null || args === void 0 ? void 0 : args.key);
                Monitor_1.postSimpleStateMessage(value, "delete");
            };
            const value = this.state[" $stateType"] === "WRITABLE" ?
                new WritableStateValue_1.WritableStateValue(this, args, disposer) :
                new ComputedStateValue_1.ComputedStateValue(this, args, disposer);
            Monitor_1.postSimpleStateMessage(value, "insert");
            return value;
        });
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
    mintor() {
        if (this.state[" $parameterized"]) {
            const parameterizedValues = [];
            this.valueMap.forEach((k, v) => {
                const loadable = v.loadable;
                parameterizedValues.push({
                    parameter: k !== null && k !== void 0 ? k : "",
                    value: loadable.data
                });
            });
            parameterizedValues.sort((a, b) => util_1.compare(a, b, "parameter"));
            return {
                name: this.state[" $name"],
                parameterizedValues
            };
        }
        const loadable = this.valueMap.get(undefined).loadable;
        return {
            name: this.state[" $name"],
            value: loadable.data
        };
    }
}
exports.StateInstance = StateInstance;
