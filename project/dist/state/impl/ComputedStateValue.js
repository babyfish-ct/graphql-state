"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputedStateValue = void 0;
const InternalComputedContext_1 = require("./InternalComputedContext");
const StateValue_1 = require("./StateValue");
class ComputedStateValue extends StateValue_1.StateValue {
    constructor(stateInstance, variablesCode, variables) {
        super(stateInstance, variablesCode, variables);
        this._invalid = true;
        this._asyncRequestId = 0;
        this._loadable = {
            loading: this.isAsync
        };
    }
    mount() {
        var _a;
        if (this.stateInstance.state[" $stateType"] !== "WRITABLE") {
            const mount = (_a = this.stateInstance.state[" $options"]) === null || _a === void 0 ? void 0 : _a.mount;
            if (mount !== undefined) {
                const ctx = { invalidate: this.invalidate.bind(this) };
                this._unmountHandler = mount(ctx);
            }
        }
    }
    umount() {
        try {
            this.freeContext();
        }
        finally {
            const h = this._unmountHandler;
            if (h !== undefined) {
                this._unmountHandler = undefined;
                h();
            }
        }
    }
    invalidate() {
        if (!this._invalid) {
            this._invalid = true;
            this.stateInstance.scopedStateManager.stateManager.publishStateValueChangeEvent({
                stateValue: this,
                changedType: "RESULT_CHANGE"
            });
        }
    }
    get result() {
        return this.compute();
    }
    get loadable() {
        this.compute();
        return this._loadable;
    }
    compute(parentContext) {
        if (this._invalid) {
            this.beforeCompute();
            const result = this.compute0(parentContext);
            this._result = this.afterCompute(result);
            this._invalid = false;
        }
        return this._result;
    }
    compute0(parentContext) {
        const newCtx = new InternalComputedContext_1.InternalComputedContext(parentContext !== null && parentContext !== void 0 ? parentContext : this.stateInstance.scopedStateManager, this);
        let result;
        try {
            if (this.stateInstance.state[" $parameterized"]) {
                result = this.stateInstance.state[" $valueSupplier"](this.exportContext(newCtx), this.variables);
            }
            else {
                result = this.stateInstance.state[" $valueSupplier"](this.exportContext(newCtx));
            }
        }
        catch (ex) {
            newCtx.close();
            throw ex;
        }
        this.freeContext();
        this._ctx = newCtx;
        return result;
    }
    freeContext() {
        const ctx = this._ctx;
        if (ctx !== undefined) {
            this._ctx = undefined;
            ctx.close();
        }
    }
    exportContext(ctx) {
        let publicContext = getFormContext.bind(ctx);
        publicContext.self = getSelfFormContext.bind(ctx);
        publicContext.object = objectFormContext.bind(ctx);
        return publicContext;
    }
    get isAsync() {
        return this.stateInstance.state[" $stateType"] === "ASYNC";
    }
    beforeCompute() {
        if (this.isAsync && !this._loadable.loading) {
            this._loadable = {
                data: this._loadable.data,
                loading: true
            };
            this.stateInstance.scopedStateManager.stateManager.publishStateValueChangeEvent({
                stateValue: this,
                changedType: "ASYNC_STATE_CHANGE"
            });
        }
    }
    afterCompute(result) {
        if (this.isAsync) {
            const asyncRequestId = ++this._asyncRequestId;
            return result
                .then(data => {
                if (this._asyncRequestId === asyncRequestId) {
                    this._loadable = {
                        data,
                        loading: false
                    };
                }
                return data;
            })
                .catch(error => {
                if (this._asyncRequestId === asyncRequestId) {
                    this._loadable = {
                        error,
                        loading: false
                    };
                }
                return error;
            })
                .finally(() => {
                if (this._asyncRequestId === asyncRequestId) {
                    this.stateInstance.scopedStateManager.stateManager.publishStateValueChangeEvent({
                        stateValue: this,
                        changedType: "ASYNC_STATE_CHANGE"
                    });
                }
            });
        }
        this._loadable = {
            loading: false,
            data: result
        };
        return result;
    }
}
exports.ComputedStateValue = ComputedStateValue;
function getFormContext(state, options) {
    const ctx = this;
    return ctx.get(state, options);
}
function getSelfFormContext(options) {
    const ctx = this;
    return ctx.getSelf(options);
}
function objectFormContext(fetcher, id, variables) {
    const ctx = this;
    return ctx.object(fetcher, id, variables);
}
