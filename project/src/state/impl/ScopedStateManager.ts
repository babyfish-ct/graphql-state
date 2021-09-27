import { State, StatePropagation, StateScopeMode } from "../State";
import { StateInstance } from "./StateInstance";
import { StateManagerImpl } from "./StateManagerImpl";

export class ScopedStateManager {

    private _stateManager: StateManagerImpl<any>;

    private _parent?: ScopedStateManager;

    private _instanceMap = new Map<any, StateInstance>();

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
        propagation: StatePropagation
    ): StateInstance {
        
        const instance = this.getInstance(state, propagation !== "REQUIRES_NEW");
        if (instance !== undefined) {
            return instance;
        }
        
        if (propagation === "MANDATORY") {
            throw new Error(`This propagation is "MANDATORY" but the state cannot be found`);
        }

        return this.createInstance(state, propagation);
    }

    private getInstance(
        state: State<any>,
        findInParent: boolean
    ): StateInstance | undefined {
        const instance = this._instanceMap.get(state);
        if (instance !== undefined) {
            return instance;
        }
        if (findInParent && this._parent) {
            return this._parent.getInstance(state, true);
        }
        return undefined;
    }

    private createInstance(
        state: State<any>,
        propagation: StatePropagation,
    ): StateInstance {

        const mode = state[" $options"]?.mode ?? "GLOBAL_SCOPE_ONLY";

        if (propagation === "REQUIRES_NEW" && this._parent !== undefined) {
            if (mode === "GLOBAL_SCOPE_ONLY") {
                throw new Error(`This propagation is "REQUIRES_NEW" and current scope is not global scope, but the state is "GLOBAL_SCOPE_ONLY"`);
            }
        }

        return this.createInstance0(state, mode);
    }

    private createInstance0(
        state: any,
        mode: StateScopeMode 
    ) {
        if (mode === "NESTED_SCOPE_ONLY" && this._parent === undefined) {
            throw new Error(`The current scope is global scope, but the state is "NESTED_SCOPE_ONLY"`);
        }
        if (mode === "GLOBAL_SCOPE_ONLY" && this._parent !== undefined) {
            return this._parent.createInstance0(state, mode);
        }

        const instance = new StateInstance(this, state);
        this._instanceMap.set(state, instance);
        return instance;
    }
}
