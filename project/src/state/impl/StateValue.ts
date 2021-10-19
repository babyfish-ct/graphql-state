import { ComputedStateCreationOptions, StateUnmoutHandler, WritableStateCreationOptions } from "../State";
import { StateInstance } from "./StateInstance";
import { standardizedVariables } from "./Variables";

export abstract class StateValue {

    private _refCount = 0;

    private _unmountHandler?: StateUnmoutHandler;

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
        const state = this.stateInstance.state;
        const mount: Mount | undefined = state[" $stateType"] === "WRITABLE" ? 
            (state[" $options"] as WritableStateCreationOptions<any> | undefined)?.mount :
            (state[" $options"] as ComputedStateCreationOptions | undefined)?.mount;
        if (mount !== undefined) {
            const ctx = this.createMountContext();
            this._unmountHandler = mount(ctx) as StateUnmoutHandler | undefined;
        }
    }

    umount() {
        const h = this._unmountHandler;
        if (h !== undefined) {
            this._unmountHandler = undefined;
            h();
        }
    }

    protected abstract createMountContext(): any;
}

export interface Loadable<T = any> {
    readonly data?: T;
    readonly loading: boolean;
    readonly error?: Error;
}

type Mount = (ctx: any) => StateUnmoutHandler | undefined | void;