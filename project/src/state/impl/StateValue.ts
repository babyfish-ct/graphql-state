import { ComputedStateCreationOptions, ReleasePolicy, StateUnmoutHandler, WritableStateCreationOptions } from "../State";
import { VariableArgs } from "./Args";
import { StateInstance } from "./StateInstance";

export abstract class StateValue {

    private _refCount = 0;

    private _mounted = false;

    private _unmountHandler?: StateUnmoutHandler;

    private _disposeTimerId?: NodeJS.Timeout;

    private _createdMillis: number;

    constructor(
        readonly stateInstance: StateInstance,
        readonly args: VariableArgs | undefined,
        private disposer: () => void
    ) {
        if (!stateInstance.state[" $parameterized"] && args !== undefined) {
            throw new Error("Cannot create state value with varibles for single state without parameters");
        }
        this._createdMillis = new Date().getTime();
    }

    abstract get result(): any;

    abstract get loadable(): Loadable;

    retain(): this {
        if (this._refCount++ === 0) {
            this.mount();
        }
        return this;
    }

    release(releasePolicy?: ReleasePolicy) {
        if (--this._refCount === 0) {
            const millis = (releasePolicy ?? this.stateInstance.scopedStateManager.stateManager.releasePolicy)(
                new Date().getTime() - this._createdMillis
            );
            if (millis <= 0) {
                this.dispose(true);
                return;
            }
            if (this._disposeTimerId !== undefined) {
                clearTimeout(this._disposeTimerId);
            }
            this._disposeTimerId = setTimeout(() => {
                if (this._refCount === 0) {
                    this.dispose(true);
                }
            }, millis);
        }
    }

    protected abstract createMountContext(): any;

    dispose(executeExternalDisposer: boolean) {
        if (this._disposeTimerId !== undefined) {
            clearTimeout(this._disposeTimerId);
            this._disposeTimerId = undefined;
        }
        try {
            if (executeExternalDisposer) {
                this.disposer();
            }
        } finally {
            this.umount();
        }
    }

    private mount() {
        if (!this._mounted) {
            this._mounted = true;
            const state = this.stateInstance.state;
            const mount: Mount | undefined = state[" $stateType"] === "WRITABLE" ? 
                (state[" $options"] as WritableStateCreationOptions<any> | undefined)?.mount :
                (state[" $options"] as ComputedStateCreationOptions | undefined)?.mount;
            if (mount !== undefined) {
                const ctx = this.createMountContext();
                this._unmountHandler = mount(ctx) as StateUnmoutHandler | undefined;
            }
            this.onMount();
        }
    }

    private umount() {
        if (this._mounted) {
            this._mounted = false;
            try {
                this.onUnmount();
            } finally {
                const h = this._unmountHandler;
                if (h !== undefined) {
                    this._unmountHandler = undefined;
                    h();
                }
            }
        }
    }

    protected onMount() {}

    protected onUnmount() {}
}

export interface Loadable<T = any> {
    readonly data?: T;
    readonly loading: boolean;
    readonly error?: Error;
}

type Mount = (ctx: any) => StateUnmoutHandler | undefined | void;