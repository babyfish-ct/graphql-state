import { State, StateUnmoutHandler } from "../State";
import { standardizedVariables } from "./Variables";

export class StateValue {

    private _refCount = 0;

    private _variables: any;

    private _unmountHandler?: StateUnmoutHandler;

    constructor(
        private state: State<any, any>,
        variables: any
    ) {
        this._variables = standardizedVariables(variables);
    }

    get variables(): any {
        return this._variables;
    }

    retain(): boolean {
        return this._refCount++ === 0;
    }

    release(): boolean {
        const rc = --this._refCount;
        if (rc < 0) {
            throw new Error("Internal bug");
        }
        return rc === 0;
    }

    invalidate() {

    }

    mount() {
        if (this.state[" $stateType"] !== "WRITABLE") {
            const mount = this.state[" $options"]?.mount;
            if (mount !== undefined) {
                const invalidate = this.invalidate.bind(this);
                this._unmountHandler = mount(invalidate);
            }
        }
    }

    umount() {
        const h = this._unmountHandler;
        if (h !== undefined) {
            this._unmountHandler = undefined;
            h();
        }
    }
}