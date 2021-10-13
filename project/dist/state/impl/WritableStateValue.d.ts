import { StateInstance } from "./StateInstance";
import { Loadable, StateValue } from "./StateValue";
export declare class WritableStateValue extends StateValue {
    private _lodable;
    readonly accessor: any;
    constructor(stateInstance: StateInstance, variablesCode: string | undefined, variables: any);
    get result(): any;
    get loadable(): Loadable;
    data(data: any): void;
    protected createMountContext(): any;
}
