import { State, StateAccessingScope } from "../State";
import { StateInstance } from "./StateInstance";
import { StateManagerImpl } from "./StateManagerImpl";
export declare class ScopedStateManager {
    private _stateManager;
    private _parent?;
    private _instanceMap;
    constructor(parent: StateManagerImpl<any> | ScopedStateManager);
    get parent(): ScopedStateManager | undefined;
    get stateManager(): StateManagerImpl<any>;
    instance(state: State<any>, scope: StateAccessingScope): StateInstance;
    private getInstance;
    private createInstance;
}
