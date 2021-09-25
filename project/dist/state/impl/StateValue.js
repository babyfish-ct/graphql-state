"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateValue = void 0;
const Variables_1 = require("./Variables");
class StateValue {
    constructor(state, variables) {
        this.state = state;
        this._refCount = 0;
        this._variables = Variables_1.standardizedVariables(variables);
    }
    get variables() {
        return this._variables;
    }
    retain() {
        return this._refCount++ === 0;
    }
    release() {
        const rc = --this._refCount;
        if (rc < 0) {
            throw new Error("Internal bug");
        }
        return rc === 0;
    }
    invalidate() {
    }
    mount() {
        var _a;
        if (this.state[" $stateType"] !== "WRITABLE") {
            const mount = (_a = this.state[" $options"]) === null || _a === void 0 ? void 0 : _a.mount;
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
}
exports.StateValue = StateValue;
