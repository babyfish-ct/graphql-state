import { StateInstance } from "./StateInstance";
export declare abstract class StateValue {
    readonly stateInstance: StateInstance;
    readonly variablesCode: string | undefined;
    readonly variables: any;
    private _refCount;
    constructor(stateInstance: StateInstance, variablesCode: string | undefined, variables: any);
    abstract get result(): any;
    abstract get loadable(): any;
    retain(): boolean;
    release(): boolean;
    mount(): void;
    umount(): void;
}
export interface Loadable {
    readonly data?: any;
    readonly loading: boolean;
    readonly error?: Error;
}
