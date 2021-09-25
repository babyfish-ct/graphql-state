import { State } from "../State";
import { StateValue } from "./StateValue";
export declare class StateInstance {
    private state;
    private valueMap;
    constructor(state: State<any, any>);
    get(variables: any): StateValue;
    retain(variablesCode: string | undefined, variables: any): StateValue;
    release(variablesCode: string | undefined): void;
}
