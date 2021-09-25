import { State, StatePropagation } from "../State";
import { StateInstance } from "./StateInstance";
import { StateManagerImpl } from "./StateManagerImpl";
export declare class ScopedStateManager {
    private _stateManager;
    private _parent?;
    private _instanceMap;
    constructor(parent: StateManagerImpl<any> | ScopedStateManager);
    get parent(): ScopedStateManager | undefined;
    instance(state: State<any, any>, propagation: StatePropagation): StateInstance;
    private getInstance;
    private createInstance;
    private createInstance0;
}
