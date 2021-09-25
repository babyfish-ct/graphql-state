import { State } from "../State";
export declare class StateValue {
    private state;
    private _refCount;
    private _variables;
    private _unmountHandler?;
    constructor(state: State<any, any>, variables: any);
    get variables(): any;
    retain(): boolean;
    release(): boolean;
    invalidate(): void;
    mount(): void;
    umount(): void;
}
