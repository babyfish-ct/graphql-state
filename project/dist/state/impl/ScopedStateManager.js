"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopedStateManager = void 0;
const StateInstance_1 = require("./StateInstance");
class ScopedStateManager {
    constructor(parent) {
        this._instanceMap = new Map();
        if (parent instanceof ScopedStateManager) {
            this._parent = parent;
            this._stateManager = parent._stateManager;
        }
        else {
            this._stateManager = parent;
        }
    }
    get parent() {
        return this._parent;
    }
    get stateManager() {
        return this._stateManager;
    }
    instance(state, propagation) {
        const instance = this.getInstance(state, propagation !== "REQUIRES_NEW");
        if (instance !== undefined) {
            return instance;
        }
        if (propagation === "MANDATORY") {
            throw new Error(`This propagation is "MANDATORY" but the state cannot be found`);
        }
        return this.createInstance(state, propagation);
    }
    getInstance(state, findInParent) {
        const instance = this._instanceMap.get(state);
        if (instance !== undefined) {
            return instance;
        }
        if (findInParent && this._parent) {
            return this._parent.getInstance(state, true);
        }
        return undefined;
    }
    createInstance(state, propagation) {
        var _a, _b;
        const mode = (_b = (_a = state[" $options"]) === null || _a === void 0 ? void 0 : _a.mode) !== null && _b !== void 0 ? _b : "GLOBAL_SCOPE_ONLY";
        if (propagation === "REQUIRES_NEW" && this._parent !== undefined) {
            if (mode === "GLOBAL_SCOPE_ONLY") {
                throw new Error(`This propagation is "REQUIRES_NEW" and current scope is not global scope, but the state is "GLOBAL_SCOPE_ONLY"`);
            }
        }
        return this.createInstance0(state, mode);
    }
    createInstance0(state, mode) {
        if (mode === "NESTED_SCOPE_ONLY" && this._parent === undefined) {
            throw new Error(`The current scope is global scope, but the state is "NESTED_SCOPE_ONLY"`);
        }
        if (mode === "GLOBAL_SCOPE_ONLY" && this._parent !== undefined) {
            return this._parent.createInstance0(state, mode);
        }
        const instance = new StateInstance_1.StateInstance(this, state);
        this._instanceMap.set(state, instance);
        return instance;
    }
}
exports.ScopedStateManager = ScopedStateManager;
