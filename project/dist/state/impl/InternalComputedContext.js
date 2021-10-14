"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalComputedContext = void 0;
const QueryArgs_1 = require("../../entities/QueryArgs");
const ComputedStateValue_1 = require("./ComputedStateValue");
const Variables_1 = require("./Variables");
class InternalComputedContext {
    constructor(parent, currentStateValue) {
        this.currentStateValue = currentStateValue;
        this.stateValueDependencies = new Set();
        this.queryResultDependencies = new Set();
        this.closed = false;
        if (parent instanceof InternalComputedContext) {
            this.parent = parent;
            this.scope = parent.scope;
        }
        else {
            this.scope = parent;
        }
        this.stateValueChangeListener = this.onStateValueChange.bind(this);
        this.queryResultChangeListener = this.onQueryResultChange.bind(this);
        this.scope.stateManager.addStateValueChangeListener(this.stateValueChangeListener);
        this.scope.stateManager.addQueryResultChangeListener(this.queryResultChangeListener);
    }
    close() {
        if (!this.closed) {
            this.scope.stateManager.removeQueryResultChangeListener(this.queryResultChangeListener);
            this.scope.stateManager.removeStateValueChangeListener(this.stateValueChangeListener);
            this.closed = true;
            let exception = undefined;
            for (const dep of this.stateValueDependencies) {
                try {
                    dep.stateInstance.release(dep.variables);
                }
                catch (ex) {
                    if (exception === undefined) {
                        exception = ex;
                    }
                }
            }
            const entityManager = this.scope.stateManager.entityManager;
            for (const dep of this.queryResultDependencies) {
                try {
                    entityManager.release(dep.queryArgs);
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
        this.stateValueDependencies.add(stateValue);
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
    object(fetcher, id, variables) {
        return this.objects(fetcher, [id], variables)[0];
    }
    objects(fetcher, ids, variables) {
        if (this.closed) {
            throw new Error("ComputedContext has been closed");
        }
        const entityManager = this.scope.stateManager.entityManager;
        const queryResult = entityManager.retain(QueryArgs_1.QueryArgs.create(fetcher, ids, variables));
        let result;
        try {
            result = queryResult.promise;
        }
        catch (ex) {
            entityManager.release(queryResult.queryArgs);
        }
        this.queryResultDependencies.add(queryResult);
        return result;
    }
    onStateValueChange(e) {
        if (e.changedType === "RESULT_CHANGE" && this.stateValueDependencies.has(e.stateValue)) {
            this.currentStateValue.invalidate();
        }
    }
    onQueryResultChange(e) {
        if (e.changedType === "RESULT_CHANGE" && this.queryResultDependencies.has(e.queryResult)) {
            this.currentStateValue.invalidate();
        }
    }
}
exports.InternalComputedContext = InternalComputedContext;
