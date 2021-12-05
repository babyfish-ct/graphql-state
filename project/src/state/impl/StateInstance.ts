import { postSimpleStateMessage, SimpleState, ParameterizedValue } from "../Monitor";
import { State } from "../State";
import { ReleasePolicy } from "../Types";
import { VariableArgs } from "./Args";
import { ComputedStateValue } from "./ComputedStateValue";
import { ScopedStateManager } from "./ScopedStateManager";
import { SpaceSavingMap } from "./SpaceSavingMap";
import { StateValue } from "./StateValue";
import { compare } from "./util";
import { WritableStateValue } from "./WritableStateValue";

export class StateInstance {

    private valueMap = new SpaceSavingMap<string | undefined, StateValue>();

    constructor(
        readonly scopedStateManager: ScopedStateManager,
        readonly state: State<any>
    ) {

    }

    retain(args: VariableArgs | undefined): StateValue {
        const stateValue = this.valueMap.computeIfAbsent(
            args?.key, 
            () => {
                const disposer = () => {
                    this.valueMap.remove(args?.key);
                    postSimpleStateMessage(value, "delete");
                }
                const value = this.state[" $stateType"] === "WRITABLE" ?
                    new WritableStateValue(this, args, disposer) :
                    new ComputedStateValue(this, args, disposer);
                postSimpleStateMessage(value, "insert");
                return value;
            }
        );
        return stateValue.retain();
    }

    release(args: VariableArgs | undefined, releasePolicy?: ReleasePolicy<any>) {
        this.valueMap.get(args?.key)?.release(releasePolicy);
    }

    dispose() {
        const values: StateValue[] = [];
        this.valueMap.forEachValue(value => { values.push(value) });
        let exception: any = undefined;
        for (const value of values) {
            try {
                value.dispose(false);
            } catch (ex) {
                if (ex === undefined) {
                    exception = ex;
                }
            }
        }
        if (exception !== undefined) {
            throw exception;
        }
    }

    mintor(): SimpleState {
        if (this.state[" $parameterized"]) {
            const parameterizedValues: ParameterizedValue[] = [];
            this.valueMap.forEach((k, v) => {
                const loadable = v.loadable;
                parameterizedValues.push({
                    parameter: k ?? "",
                    value: loadable.data
                });
            });
            parameterizedValues.sort((a, b) => compare(a, b, "parameter"));
            return {
                name: this.state[" $name"],
                parameterizedValues
            };
        }
        const loadable = this.valueMap.get(undefined)!.loadable;
        return {
            name: this.state[" $name"], 
            value: loadable.data
        }
    }
}