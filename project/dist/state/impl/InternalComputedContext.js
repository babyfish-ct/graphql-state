"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalComputedContext = void 0;
const QueryContext_1 = require("../../entities/QueryContext");
const ComputedStateValue_1 = require("./ComputedStateValue");
const Variables_1 = require("./Variables");
class InternalComputedContext {
    constructor(parent, currentStateValue) {
        this.currentStateValue = currentStateValue;
        this.dependencies = new Set();
        this.closed = false;
        if (parent instanceof InternalComputedContext) {
            this.parent = parent;
            this.scope = parent.scope;
        }
        else {
            this.scope = parent;
        }
        this.stateValueChangeListener = this.onStateValueChange.bind(this);
        this.scope.stateManager.addStateChangeListener(this.stateValueChangeListener);
    }
    close() {
        if (!this.closed) {
            this.scope.stateManager.removeStateChangeListener(this.stateValueChangeListener);
            this.closed = true;
            let exception = undefined;
            for (const dep of this.dependencies) {
                try {
                    dep.stateInstance.release(dep.variables);
                }
                catch (ex) {
                    if (exception === undefined) {
                        exception = ex;
                    }
                }
            }
            if (exception !== undefined) {
                throw exception;
            }
        }
    }
    getSelf(options) {
        var _a;
        const variables = Variables_1.standardizedVariables((_a = options) === null || _a === void 0 ? void 0 : _a.variables);
        const variablesCode = variables !== undefined ? JSON.stringify(variables) : undefined;
        if (this.currentStateValue.variablesCode === variablesCode) {
            throw new Error("Cannot get the current state with same variables in the computing implementation, please support another variables");
        }
        return this.get(this.currentStateValue.stateInstance.state, options);
    }
    get(state, options) {
        var _a, _b;
        if (this.closed) {
            throw new Error("ComputedContext has been closed");
        }
        const variables = Variables_1.standardizedVariables((_a = options) === null || _a === void 0 ? void 0 : _a.variables);
        const variablesCode = variables !== undefined ? JSON.stringify(variables) : undefined;
        const stateInstance = this.scope.instance(state, (_b = options === null || options === void 0 ? void 0 : options.propagation) !== null && _b !== void 0 ? _b : "REQUIRED");
        const stateValue = stateInstance.retain(variablesCode, variables);
        let result;
        try {
            result = this.get0(stateValue);
        }
        catch (ex) {
            stateInstance.release(variablesCode);
            throw ex;
        }
        this.dependencies.add(stateValue);
        return result;
    }
    get0(stateValue) {
        for (let ctx = this; ctx !== undefined; ctx = ctx.parent) {
            if (stateValue === ctx.currentStateValue) {
                throw new Error("Computing circular dependencies");
            }
        }
        if (stateValue instanceof ComputedStateValue_1.ComputedStateValue) {
            return stateValue.compute(this);
        }
        else {
            return stateValue.result;
        }
    }
    query(...args) {
        if (this.closed) {
            throw new Error("ComputedContext has been closed");
        }
        const graphQLFetcherIndex = args[0][" $isGraphQLFetcher"] ? 0 :
            args[1][" $isGraphQLFetcher"] ? 1 :
                -1;
        let id = undefined;
        if (graphQLFetcherIndex === -1 || graphQLFetcherIndex === 1) {
            id = graphQLFetcherIndex === -1 ? args[1] : args[0];
            if (id === undefined || id === null) {
                throw new Error("id cannot be undefined or null");
            }
        }
        const graphQLFetcher = graphQLFetcherIndex !== -1 ? args[graphQLFetcherIndex] : undefined;
        const options = graphQLFetcherIndex === -1 ? args[3] : args[graphQLFetcherIndex + 1];
        const queryContext = new QueryContext_1.QueryContext(this.scope.stateManager.entityManager);
        if (graphQLFetcher !== undefined) {
            if (id === undefined) {
                return queryContext.queryObject(id, graphQLFetcher, options);
            }
            return queryContext.queryObject(graphQLFetcher, options);
        }
        return queryContext.queryObject(args[0], id, args[2]);
    }
    onStateValueChange(e) {
        if (e.changedType === "RESULT_CHANGE" && this.dependencies.has(e.stateValue)) {
            this.currentStateValue.invalidate();
        }
    }
}
exports.InternalComputedContext = InternalComputedContext;
