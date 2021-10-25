import { State, StateAccessingScope } from "../State";
import { StateInstance } from "./StateInstance";
import { StateManagerImpl } from "./StateManagerImpl";
export declare class ScopedStateManager {
    private name?;
    private _stateManager;
    private _parent?;
    private _childMap?;
    private _instanceMap;
    private _path;
    constructor(parent: StateManagerImpl<any> | ScopedStateManager, name?: string | undefined);
    get parent(): ScopedStateManager | undefined;
    get stateManager(): StateManagerImpl<any>;
    get path(): string;
    subScope(path: string): ScopedStateManager;
    private childScope;
    instance(state: State<any>, scope: StateAccessingScope): StateInstance;
    private getInstance;
    private createInstance;
}
