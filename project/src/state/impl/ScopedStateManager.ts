import { State, StateAccessingScope, StateScopeMode } from "../State";
import { StateInstance } from "./StateInstance";
import { StateManagerImpl } from "./StateManagerImpl";

export class ScopedStateManager {

    private _stateManager: StateManagerImpl<any>;

    private _parent?: ScopedStateManager;

    private _childMap = new Map<string, ScopedStateManager>();

    private _path: string;

    private _instanceMap = new Map<string, StateInstance>();

    private constructor(parent: StateManagerImpl<any> | ScopedStateManager, readonly name?: string) {
        if (parent instanceof ScopedStateManager) {
            this._parent = parent;
            this._stateManager = parent._stateManager;
            this._path = `${parent._path}/${name}`;
        } else {
            this._stateManager = parent;
            this._path = "";
        }
    }

    get parent(): ScopedStateManager | undefined {
        return this._parent;
    }

    get path(): string {
        return this._path;
    }

    get stateManager(): StateManagerImpl<any> {
        return this._stateManager;
    }

    static createRoot(stateManager: StateManagerImpl<any>): ScopedStateManager {
        return new ScopedStateManager(stateManager);
    }

    child(name: string): ScopedStateManager {
        if (name === undefined || name === null || name === "") {
            throw new Error("name is required for child scope");
        }
        let child = this._childMap.get(name);
        if (child === undefined) {
            child = new ScopedStateManager(this, name);
            this._childMap.get(name);
        }
        return child;
    }

    dispose() {
        for (const [, child] of this._childMap) {
            child.dispose();
        }
        this._childMap.clear();
    }

    instance(
        state: State<any>,
        scope: StateAccessingScope
    ): StateInstance {

        const instance = this.getInstance(state, scope);
        if (instance !== undefined) {
            return instance;
        }
        return this.createInstance(state, scope);
    }

    private getInstance(
        state: State<any>,
        scope: StateAccessingScope
    ): StateInstance | undefined {
        const instance = this._instanceMap.get(state[" $name"]);
        if (instance !== undefined) {
            return instance;
        }
        if (scope !== "local" && this._parent) {
            return this._parent.getInstance(state, scope);
        }
        return undefined;
    }

    private createInstance(
        state: State<any>,
        scope: StateAccessingScope
    ): StateInstance {

        if (scope !== "local" && this._parent) {
            return this._parent.createInstance(state, scope);
        }
        
        const mode: StateScopeMode = state[" $options"]?.mode ?? "global-scope-only";
        if (mode === "global-scope-only" && this._parent) {
            throw new Error(`The state using scope is "local" and current scope is not global scope, but the state is "global-scope-only"`);
        }

        const instance = new StateInstance(this, state);
        this._instanceMap.set(state[" $name"], instance);
        return instance;
    }
}
