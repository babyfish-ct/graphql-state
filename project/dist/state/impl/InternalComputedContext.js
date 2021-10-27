"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalComputedContext = void 0;
const QueryArgs_1 = require("../../entities/QueryArgs");
const Args_1 = require("./Args");
const ComputedStateValue_1 = require("./ComputedStateValue");
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
            let exception = undefined;
            for (const dep of this.stateValueDependencies) {
                try {
                    dep.stateInstance.release(dep.args);
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
            this.closed = true;
        }
    }
    getSelf(options) {
        var _a, _b;
        const args = Args_1.VariableArgs.of((_a = options) === null || _a === void 0 ? void 0 : _a.variables);
        if (((_b = this.currentStateValue.args) === null || _b === void 0 ? void 0 : _b.key) === (args === null || args === void 0 ? void 0 : args.key)) {
            throw new Error("Cannot get the current state with same variables in the computing implementation, please support another variables");
        }
        return this.get(this.currentStateValue.stateInstance.state, options);
    }
    get(state, options) {
        var _a, _b;
        if (this.closed) {
            throw new Error("ComputedContext has been closed");
        }
        const args = Args_1.VariableArgs.of((_a = options) === null || _a === void 0 ? void 0 : _a.variables);
        const stateInstance = this.scope.instance(state, (_b = options === null || options === void 0 ? void 0 : options.scope) !== null && _b !== void 0 ? _b : "auto");
        const stateValue = stateInstance.retain(args);
        let result;
        try {
            result = this.get0(stateValue);
        }
        catch (ex) {
            stateInstance.release(args);
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
    object(fetcher, id, options) {
        return this.queryImpl(fetcher, [id], options)[0];
    }
    objects(fetcher, ids, options) {
        return this.queryImpl(fetcher, ids, options);
    }
    query(fetcher, options) {
        return this.queryImpl(fetcher, undefined, options);
    }
    queryImpl(fetcher, ids, options) {
        if (this.closed) {
            throw new Error("ComputedContext has been closed");
        }
        if (fetcher.fetchableType.name === "Query") {
            if (ids !== undefined) {
                throw new Error('Internal bug: Cannot specify is for generic query');
            }
        }
        else {
            if (ids === undefined) {
                throw new Error('Internal bug: Object query requires "ids"');
            }
        }
        const entityManager = this.scope.stateManager.entityManager;
        const queryResult = entityManager.retain(QueryArgs_1.QueryArgs.create(fetcher, undefined, Args_1.OptionArgs.of(options)));
        let promise;
        try {
            promise = queryResult.promise;
        }
        catch (ex) {
            entityManager.release(queryResult.queryArgs);
            throw ex;
        }
        this.queryResultDependencies.add(queryResult);
        return promise;
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
