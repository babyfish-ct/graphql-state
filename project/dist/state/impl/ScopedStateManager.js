"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopedStateManager = void 0;
const StateInstance_1 = require("./StateInstance");
class ScopedStateManager {
    constructor(parent, name) {
        this.name = name;
        this._instanceMap = new Map();
        if (parent instanceof ScopedStateManager) {
            this._parent = parent;
            this._stateManager = parent._stateManager;
            this._path = parent.name === undefined ? `/${name}` : `${parent._path}/${name}`;
        }
        else {
            this._stateManager = parent;
            this._path = `/`;
        }
    }
    get parent() {
        return this._parent;
    }
    get stateManager() {
        return this._stateManager;
    }
    get path() {
        return this._path;
    }
    subScope(path) {
        if (this.parent !== undefined) {
            throw new Error('The function "subScope" can only be supported by root scope');
        }
        if (path === "/") {
            return this;
        }
        let scope = this;
        for (const name of path.split("/")) {
            scope = scope.childScope(name);
        }
        return scope;
    }
    childScope(name) {
        var _a;
        if (name === "") {
            return this;
        }
        let child = (_a = this._childMap) === null || _a === void 0 ? void 0 : _a.get(name);
        if (child === undefined) {
            let childMap = this._childMap;
            if (childMap === undefined) {
                this._childMap = childMap = new Map();
            }
            childMap.set(name, child = new ScopedStateManager(this, name));
            console.log(childMap);
        }
        return child;
    }
    instance(state, scope) {
        console.log(`Get ${state[" $name"]} from ${this.path}`);
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
        console.log("Create local state................");
        if (scope !== "local" && this._parent) {
            return this._parent.createInstance(state, scope);
        }
        const creatingScope = (_b = (_a = state[" $options"]) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : "global-scope-only";
        if (creatingScope === "global-scope-only" && this._parent) {
            throw new Error(`The state using scope is "local" and current scope is not global scope, but the state is "global-scope-only"`);
        }
        const instance = new StateInstance_1.StateInstance(this, state);
        this._instanceMap.set(state[" $name"], instance);
        return instance;
    }
}
exports.ScopedStateManager = ScopedStateManager;
