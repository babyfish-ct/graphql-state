import { State } from "../State";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValue } from "./StateValue";
export declare class StateInstance {
    readonly scopedStateManager: ScopedStateManager;
    readonly state: State<any>;
    private valueMap;
    constructor(scopedStateManager: ScopedStateManager, state: State<any>);
    retain(variablesCode: string | undefined, variables: any): StateValue;
    release(variablesCode: string | undefined): void;
}
