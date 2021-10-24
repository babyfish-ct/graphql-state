import { State, StateAccessingScope } from "../State";
import { StateInstance } from "./StateInstance";
import { StateManagerImpl } from "./StateManagerImpl";
export declare class ScopedStateManager {
    readonly name?: string | undefined;
    private _stateManager;
    private _parent?;
    private _childMap;
    private _path;
    private _instanceMap;
    private constructor();
    get parent(): ScopedStateManager | undefined;
    get path(): string;
    get stateManager(): StateManagerImpl<any>;
    static createRoot(stateManager: StateManagerImpl<any>): ScopedStateManager;
    child(name: string): ScopedStateManager;
    dispose(): void;
    instance(state: State<any>, scope: StateAccessingScope): StateInstance;
    private getInstance;
    private createInstance;
}
