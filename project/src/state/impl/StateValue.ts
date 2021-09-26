import { StateInstance } from "./StateInstance";
import { standardizedVariables } from "./Variables";

export abstract class StateValue {

    private _refCount = 0;

    private _variables: any;

    constructor(
        readonly stateInstance: StateInstance,
        readonly variablesCode: string | undefined,
        readonly variables: any
    ) {}

    abstract get result(): any

    retain(): boolean {
        return this._refCount++ === 0;
    }

    release(): boolean {
        const rc = --this._refCount;
        if (rc < 0) {
            this._refCount = 0;
            throw new Error("Internal bug: refCount is less than zero");
        }
        return rc === 0;
    }

    mount() {
        
    }

    umount() {
        
    }
}

export type StateStatus = "LOADING" | "ERROR" | "READY";