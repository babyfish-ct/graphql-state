"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputedStateValue = void 0;
const InternalComputedContext_1 = require("./InternalComputedContext");
const StateValue_1 = require("./StateValue");
class ComputedStateValue extends StateValue_1.StateValue {
    constructor(stateInstance, args, disposer) {
        super(stateInstance, args, disposer);
        this._invalid = true;
        this._currentAsyncRequestId = 0;
        this._loadable = {
            loading: this.isAsync,
        };
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
    get rawData() {
        return this._loadable.data;
    }
    get loadable() {
        this.compute();
        return this._loadable;
    }
    compute(parentContext) {
        if (this._invalid) {
            this._invalid = false;
            this.beforeCompute();
            const result = this.compute0(parentContext);
            this._result = this.afterCompute(result);
        }
        return this._result;
    }
    createMountContext() {
        return {
            invalidate: this.invalidate.bind(this),
            stateManager: this.stateInstance.scopedStateManager.stateManager
        };
    }
    compute0(parentContext) {
        var _a, _b;
        const newCtx = new InternalComputedContext_1.InternalComputedContext(parentContext !== null && parentContext !== void 0 ? parentContext : this.stateInstance.scopedStateManager, this);
        let result;
        try {
            if (this.stateInstance.state[" $parameterized"]) {
                result = this.stateInstance.state[" $valueSupplier"](this.exportContext(newCtx), (_b = (_a = this.args) === null || _a === void 0 ? void 0 : _a.variables) !== null && _b !== void 0 ? _b : {});
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
    onUnmount() {
        this.freeContext();
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
        publicContext.objects = objectsFormContext.bind(ctx);
        publicContext.query = queryFormContext.bind(ctx);
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
            const asyncRequestId = ++this._currentAsyncRequestId;
            this.retain(); // Self holding during Async computing
            return result
                .then(data => {
                if (this._currentAsyncRequestId === asyncRequestId) {
                    this._loadable = {
                        data,
                        loading: false
                    };
                }
                return data;
            })
                .catch(error => {
                if (this._currentAsyncRequestId === asyncRequestId) {
                    this._loadable = {
                        error,
                        loading: false
                    };
                }
                return error;
            })
                .finally(() => {
                try {
                    if (this._currentAsyncRequestId === asyncRequestId) {
                        this.stateInstance.scopedStateManager.stateManager.publishStateValueChangeEvent({
                            stateValue: this,
                            changedType: "ASYNC_STATE_CHANGE"
                        });
                    }
                }
                finally {
                    this.stateInstance.release(this.args, asyncLoadingReleasePolicy); // Self holding during Async computing
                }
            });
        }
        else {
            this._loadable = {
                loading: false,
                data: result
            };
            this.stateInstance.scopedStateManager.stateManager.publishStateValueChangeEvent({
                stateValue: this,
                changedType: "RESULT_CHANGE"
            });
        }
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
function objectsFormContext(fetcher, ids, variables) {
    const ctx = this;
    return ctx.objects(fetcher, ids, variables);
}
function queryFormContext(fetcher, variables) {
    const ctx = this;
    return ctx.query(fetcher, variables);
}
function asyncLoadingReleasePolicy() {
    return 0;
}
