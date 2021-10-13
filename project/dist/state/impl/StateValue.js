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
        var _a, _b;
        const state = this.stateInstance.state;
        const mount = state[" $stateType"] === "WRITABLE" ?
            (_a = state[" $options"]) === null || _a === void 0 ? void 0 : _a.mount :
            (_b = state[" $options"]) === null || _b === void 0 ? void 0 : _b.mount;
        if (mount !== undefined) {
            const ctx = this.createMountContext();
            this._unmountHandler = mount(ctx);
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
