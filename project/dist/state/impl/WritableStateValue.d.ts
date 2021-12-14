import { VariableArgs } from "./Args";
import { StateInstance } from "./StateInstance";
import { Loadable, StateValue } from "./StateValue";
export declare class WritableStateValue extends StateValue {
    private _lodable;
    readonly accessor: any;
    constructor(stateInstance: StateInstance, args: VariableArgs | undefined, disposer: () => void);
    get result(): any;
    get rawData(): any;
    get loadable(): Loadable;
    data(data: any): void;
    protected createMountContext(): any;
}
