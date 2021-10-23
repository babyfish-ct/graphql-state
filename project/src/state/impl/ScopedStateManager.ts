import { State, StateAccessingScope, StateScopeMode } from "../State";
import { StateInstance } from "./StateInstance";
import { StateManagerImpl } from "./StateManagerImpl";

export class ScopedStateManager {

    private _stateManager: StateManagerImpl<any>;

    private _parent?: ScopedStateManager;

    private _instanceMap = new Map<string, StateInstance>();

    constructor(parent: StateManagerImpl<any> | ScopedStateManager) {
        if (parent instanceof ScopedStateManager) {
            this._parent = parent;
            this._stateManager = parent._stateManager;
        } else {
            this._stateManager = parent;
        }
    }

    get parent(): ScopedStateManager | undefined {
        return this._parent;
    }

    get stateManager(): StateManagerImpl<any> {
        return this._stateManager;
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
