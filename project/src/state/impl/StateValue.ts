import { StateInstance } from "./StateInstance";
import { standardizedVariables } from "./Variables";

export abstract class StateValue {

    private _refCount = 0;

    constructor(
        readonly stateInstance: StateInstance,
        readonly variablesCode: string | undefined,
        readonly variables: any
    ) {
        if (!stateInstance.state[" $parameterized"] && (
                variablesCode !== undefined || variables !== undefined
            )
        ) {
            throw new Error("Cannot create state value with varibles for single state without parameters");
        }
    }

    abstract get result(): any;

    abstract get loadable(): any;

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

export interface Loadable {
    readonly data?: any;
    readonly loading: boolean;
    readonly error?: Error;
}