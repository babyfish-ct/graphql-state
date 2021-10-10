"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WritableStateValue = void 0;
const StateValue_1 = require("./StateValue");
class WritableStateValue extends StateValue_1.StateValue {
    constructor(stateInstance, variablesCode, variables) {
        super(stateInstance, variablesCode, variables);
        this._lodable = {
            loading: false
        };
        this.accessor = access.bind(this);
        const defaultValue = this.stateInstance.state[" $defaultValue"];
        this._lodable = Object.assign(Object.assign({}, this._lodable), { data: stateInstance.state[" $parameterized"] && typeof defaultValue === "function" ?
                defaultValue(variables !== null && variables !== void 0 ? variables : {}) :
                defaultValue });
    }
    get result() {
        return this._lodable.data;
    }
    get loadable() {
        return this._lodable;
    }
    data(data) {
        const oldData = this._lodable.data;
        if (oldData !== data) {
            this._lodable = Object.assign(Object.assign({}, this._lodable), { data });
            this.stateInstance.scopedStateManager.stateManager.publishStateValueChangeEvent({
                stateValue: this,
                changedType: "RESULT_CHANGE"
            });
        }
    }
}
exports.WritableStateValue = WritableStateValue;
function access(...args) {
    const stateValue = this;
    if (args.length === 0) {
        return stateValue.result;
    }
    else {
        stateValue.data(args[0]);
    }
}
