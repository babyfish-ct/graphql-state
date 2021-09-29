"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateValue = void 0;
class StateValue {
    constructor(stateInstance, variablesCode, variables) {
        this.stateInstance = stateInstance;
        this.variablesCode = variablesCode;
        this.variables = variables;
        this._refCount = 0;
        if (!stateInstance.state[" $parameterized"] && (variablesCode !== undefined || variables !== undefined)) {
            throw new Error("Cannot create state value with varibles for single state without parameters");
        }
    }
    retain() {
        return this._refCount++ === 0;
    }
    release() {
        const rc = --this._refCount;
        if (rc < 0) {
            this._refCount = 0;
            throw new Error("Internal bug: refCount is less than zero");
        }
        return rc === 0;
    }
    mount() {
    }
    umount() {
    }
}
exports.StateValue = StateValue;
