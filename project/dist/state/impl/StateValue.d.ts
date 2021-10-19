import { StateInstance } from "./StateInstance";
export declare abstract class StateValue {
    readonly stateInstance: StateInstance;
    readonly variablesCode: string | undefined;
    readonly variables: any;
    private _refCount;
    private _unmountHandler?;
    constructor(stateInstance: StateInstance, variablesCode: string | undefined, variables: any);
    abstract get result(): any;
    abstract get loadable(): any;
    retain(): boolean;
    release(): boolean;
    mount(): void;
    umount(): void;
    protected abstract createMountContext(): any;
}
export interface Loadable<T = any> {
    readonly data?: T;
    readonly loading: boolean;
    readonly error?: Error;
}
