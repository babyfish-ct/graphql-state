"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScopedStateManager = void 0;
const StateInstance_1 = require("./StateInstance");
const util_1 = require("./util");
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
        }
        return child;
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
        const creatingScope = (_b = (_a = state[" $options"]) === null || _a === void 0 ? void 0 : _a.scope) !== null && _b !== void 0 ? _b : "global-scope-only";
        if (creatingScope === "global-scope-only" && this._parent) {
            throw new Error(`The state using scope is "local" and current scope is not global scope, but the state is "global-scope-only"`);
        }
        const instance = new StateInstance_1.StateInstance(this, state);
        this._instanceMap.set(state[" $name"], instance);
        return instance;
    }
    dispose() {
        var _a;
        let exception = undefined;
        if (this._childMap !== undefined) {
            for (const child of (_a = this._childMap) === null || _a === void 0 ? void 0 : _a.values()) {
                try {
                    child.dispose();
                }
                catch (ex) {
                    if (exception === undefined) {
                        exception = ex;
                    }
                }
            }
            this._childMap = undefined;
        }
        for (const instance of this._instanceMap.values()) {
            try {
                instance.dispose();
            }
            catch (ex) {
                if (exception === undefined) {
                    exception = ex;
                }
            }
        }
        this._instanceMap.clear();
        if (exception !== undefined) {
            throw exception;
        }
    }
    monitor() {
        var _a;
        const states = Array
            .from(this._instanceMap.values())
            .map(value => value.mintor());
        states.sort((a, b) => (0, util_1.compare)(a, b, "name"));
        const scopes = [];
        if (this._childMap !== undefined) {
            for (const child of this._childMap.values()) {
                scopes.push(child.monitor());
            }
        }
        scopes.sort((a, b) => (0, util_1.compare)(a, b, "name"));
        return {
            name: (_a = this.name) !== null && _a !== void 0 ? _a : "",
            states,
            scopes
        };
    }
}
exports.ScopedStateManager = ScopedStateManager;
