import { State } from "../State";
import { VariableArgs } from "./Args";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValue } from "./StateValue";
export declare class StateInstance {
    readonly scopedStateManager: ScopedStateManager;
    readonly state: State<any>;
    private valueMap;
    constructor(scopedStateManager: ScopedStateManager, state: State<any>);
    retain(args: VariableArgs | undefined): StateValue;
    release(args: VariableArgs | undefined): void;
    dispose(): void;
}
