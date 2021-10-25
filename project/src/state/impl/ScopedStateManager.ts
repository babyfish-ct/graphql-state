import { State, StateAccessingScope, StateCreationScope } from "../State";
import { StateInstance } from "./StateInstance";
import { StateManagerImpl } from "./StateManagerImpl";

export class ScopedStateManager {

    private _stateManager: StateManagerImpl<any>;

    private _parent?: ScopedStateManager;

    private _childMap?: Map<string, ScopedStateManager>;

    private _instanceMap = new Map<string, StateInstance>();

    private _path: string;

    constructor(
        parent: StateManagerImpl<any> | ScopedStateManager, 
        private name?: string
    ) {
        if (parent instanceof ScopedStateManager) {
            this._parent = parent;
            this._stateManager = parent._stateManager;
            this._path = parent.name === undefined ? `/${name}`: `${parent._path}/${name}`;
        } else {
            this._stateManager = parent;
            this._path = `/`;
        }
    }

    get parent(): ScopedStateManager | undefined {
        return this._parent;
    }

    get stateManager(): StateManagerImpl<any> {
        return this._stateManager;
    }

    get path(): string {
        return this._path;
    }

    subScope(path: string): ScopedStateManager {
        if (this.parent !== undefined) {
            throw new Error('The function "subScope" can only be supported by root scope');
        }
        if (path === "/") {
            return this;
        }
        let scope: ScopedStateManager = this;
        for (const name of path.split("/")) {
            scope = scope.childScope(name);
        }
        return scope;
    }

    private childScope(name: string): ScopedStateManager {
        if (name === "") {
            return this;
        }
        let child = this._childMap?.get(name);
        if (child === undefined) {
            let childMap = this._childMap;
            if (childMap === undefined) {
                this._childMap = childMap = new Map<string, ScopedStateManager>();
            }
            childMap.set(name, child = new ScopedStateManager(this, name));
        }
        return child;
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
        
        const creatingScope: StateCreationScope = state[" $options"]?.scope ?? "global-scope-only";
        if (creatingScope === "global-scope-only" && this._parent) {
            throw new Error(`The state using scope is "local" and current scope is not global scope, but the state is "global-scope-only"`);
        }

        const instance = new StateInstance(this, state);
        this._instanceMap.set(state[" $name"], instance);
        return instance;
    }
}
