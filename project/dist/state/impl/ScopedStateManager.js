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
    instance(state, scope) {
        const instance = this.getInstance(state, scope);
        if (instance !== undefined) {
            return instance;
        }
        return this.createInstance(state, scope);
    }
    getInstance(state, scope) {
        const instance = this._instanceMap.get(state[" $name"]);
        if (instance !== undefined) {
            return instance;
        }
        if (scope !== "local" && this._parent) {
            return this._parent.getInstance(state, scope);
        }
        return undefined;
    }
    createInstance(state, scope) {
        var _a, _b;
        if (scope !== "local" && this._parent) {
            return this._parent.createInstance(state, scope);
        }
        const mode = (_b = (_a = state[" $options"]) === null || _a === void 0 ? void 0 : _a.mode) !== null && _b !== void 0 ? _b : "global-scope-only";
        if (mode === "global-scope-only" && this._parent) {
            throw new Error(`The state using scope is "local" and current scope is not global scope, but the state is "global-scope-only"`);
        }
        const instance = new StateInstance_1.StateInstance(this, state);
        this._instanceMap.set(state[" $name"], instance);
        return instance;
    }
}
exports.ScopedStateManager = ScopedStateManager;
