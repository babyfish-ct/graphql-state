import { ReleasePolicy } from "../Types";
import { VariableArgs } from "./Args";
import { StateInstance } from "./StateInstance";
export declare abstract class StateValue {
    readonly stateInstance: StateInstance;
    readonly args: VariableArgs | undefined;
    private disposer;
    private _refCount;
    private _mounted;
    private _unmountHandler?;
    private _disposeTimerId?;
    private _retainedMillis;
    constructor(stateInstance: StateInstance, args: VariableArgs | undefined, disposer: () => void);
    abstract get result(): any;
    abstract get loadable(): Loadable;
    retain(): this;
    release(releasePolicy?: ReleasePolicy<any>): void;
    protected abstract createMountContext(): any;
    dispose(executeExternalDisposer: boolean): void;
    private mount;
    private umount;
    protected onMount(): void;
    protected onUnmount(): void;
}
export interface Loadable<T = any> {
    readonly data?: T;
    readonly loading: boolean;
    readonly error?: Error;
}
