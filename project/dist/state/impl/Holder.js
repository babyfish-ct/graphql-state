"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationResultHolder = exports.QueryResultHolder = exports.StateValueHolder = void 0;
const MutationResult_1 = require("../../entities/MutationResult");
const QueryArgs_1 = require("../../entities/QueryArgs");
const Args_1 = require("./Args");
class StateValueHolder {
    constructor(stateManager, scopePath, localUpdater) {
        this.stateManager = stateManager;
        this.scopePath = scopePath;
        this.localUpdater = localUpdater;
    }
    get() {
        const value = this.stateValue;
        if (value === undefined) {
            throw new Error("Illegal StateValueHolder that has not been set or has been released");
        }
        return value;
    }
    set(state, scopePath, options) {
        var _a, _b, _c, _d, _e;
        const serializableOptions = this.serializableOptions(options);
        const optionArgs = Args_1.OptionArgs.of(serializableOptions);
        if (((_b = (_a = this.stateValue) === null || _a === void 0 ? void 0 : _a.stateInstance) === null || _b === void 0 ? void 0 : _b.state[" $name"]) === state[" $name"] &&
            this.scopePath === scopePath &&
            ((_c = this.previousOptionArgs) === null || _c === void 0 ? void 0 : _c.key) === (optionArgs === null || optionArgs === void 0 ? void 0 : optionArgs.key)) {
            return;
        }
        if ((_d = this.stateValue) === null || _d === void 0 ? void 0 : _d.loadable.loading) { // Peak clipping
            this.deferred = {
                state,
                scopePath,
                options
            };
            return;
        }
        this.release();
        this.scopePath = scopePath;
        this.previousOptionArgs = optionArgs;
        this.stateValue = this
            .stateManager
            .scope(scopePath)
            .instance(state, (_e = serializableOptions === null || serializableOptions === void 0 ? void 0 : serializableOptions.scope) !== null && _e !== void 0 ? _e : "auto")
            .retain(Args_1.VariableArgs.of(serializableOptions === null || serializableOptions === void 0 ? void 0 : serializableOptions.variables));
        this.stateValueChangeListener = (e) => {
            if (e.stateValue === this.stateValue) {
                const deferred = this.deferred;
                this.localUpdater(old => old + 1); // Change a local state to update react component
                if (deferred !== undefined && !this.stateValue.loadable.loading) {
                    this.deferred = undefined;
                    this.set(deferred.state, deferred.scopePath, deferred.options);
                }
            }
        };
        this.stateManager.addStateValueChangeListener(this.stateValueChangeListener);
    }
    release() {
        try {
            const listener = this.stateValueChangeListener;
            if (listener !== undefined) {
                this.stateValueChangeListener = undefined;
                this.stateManager.removeStateValueChangeListener(listener);
            }
        }
        finally {
            const value = this.stateValue;
            if (value !== undefined) {
                this.stateValue = undefined;
                this.previousOptionArgs = undefined;
                value.stateInstance.release(value.args, this.releasePolicy);
            }
        }
    }
    serializableOptions(options) {
        if (options === undefined) {
            this.releasePolicy = undefined;
            return undefined;
        }
        const releasePolicy = options.releasePolicy;
        if (releasePolicy === undefined) {
            this.releasePolicy = undefined;
            return options;
        }
        this.releasePolicy = releasePolicy;
        const newOptions = Object.assign({}, options);
        newOptions.releasePolicy = undefined;
        return newOptions;
    }
}
exports.StateValueHolder = StateValueHolder;
class QueryResultHolder {
    constructor(stateManager, localUpdater) {
        this.stateManager = stateManager;
        this.localUpdater = localUpdater;
    }
    get() {
        const result = this.queryResult;
        if (result === undefined) {
            throw new Error("Illegal QueryResultHolder that has not been set or has been released");
        }
        return result;
    }
    set(fetcher, windowId, ids, options) {
        var _a, _b;
        const serializableOptions = this.serializableOptions(options);
        const oldQueryArgs = (_a = this.queryResult) === null || _a === void 0 ? void 0 : _a.queryArgs;
        const newQueryArgs = QueryArgs_1.QueryArgs.create(fetcher, windowId ?
            { schema: this.stateManager.entityManager.schema, loadMode: "initial" } :
            undefined, ids, Args_1.OptionArgs.of(serializableOptions));
        if ((oldQueryArgs === null || oldQueryArgs === void 0 ? void 0 : oldQueryArgs.key) === newQueryArgs.key) {
            return;
        }
        if ((_b = this.queryResult) === null || _b === void 0 ? void 0 : _b.loadable.loading) { //Peak clipping
            this.deferred = {
                fetcher,
                windowId,
                ids,
                options
            };
            return;
        }
        // Double check before release(entityManager can validate it too)
        if (!this.stateManager.entityManager.schema.isAcceptable(fetcher.fetchableType)) {
            throw new Error("Cannot accept that fetcher because it is not configured in the state manager");
        }
        this.release();
        this.queryResult = this.stateManager.entityManager.retain(newQueryArgs);
        this.queryResultChangeListener = (e) => {
            if (e.queryResult === this.queryResult) {
                const deferred = this.deferred;
                this.localUpdater(old => old + 1); // Change a local state to update react component
                if (deferred !== undefined && !this.queryResult.loadable.loading) {
                    this.deferred = undefined;
                    this.set(deferred.fetcher, deferred.windowId, deferred.ids, deferred.options);
                }
            }
        };
        this.stateManager.addQueryResultChangeListener(this.queryResultChangeListener);
    }
    release() {
        try {
            const listener = this.queryResultChangeListener;
            if (listener !== undefined) {
                this.queryResultChangeListener = undefined;
                this.stateManager.removeQueryResultChangeListener(listener);
            }
        }
        finally {
            const result = this.queryResult;
            if (result !== undefined) {
                this.queryResult = undefined;
                this.stateManager.entityManager.release(result.queryArgs, this.releasePolicy);
            }
        }
    }
    serializableOptions(options) {
        if (options === undefined) {
            this.releasePolicy = undefined;
            return undefined;
        }
        const releasePolicy = options.releasePolicy;
        if (releasePolicy === undefined) {
            this.releasePolicy = undefined;
            return options;
        }
        this.releasePolicy = releasePolicy;
        const newOptions = Object.assign({}, options);
        newOptions.releasePolicy = undefined;
        return newOptions;
    }
}
exports.QueryResultHolder = QueryResultHolder;
class MutationResultHolder {
    constructor(stateManager, localUpdater) {
        this.stateManager = stateManager;
        this.localUpdater = localUpdater;
    }
    get() {
        const result = this.mutationResult;
        if (result === undefined) {
            throw new Error("Illegal QueryResultHolder that has not been set or has been released");
        }
        return result;
    }
    set(fetcher, options) {
        let result;
        if (this.isSameFetcher(fetcher) && this.isSameVariables(options === null || options === void 0 ? void 0 : options.variables)) {
            result = this.mutationResult;
        }
        else {
            result = new MutationResult_1.MutationResult(this.stateManager, this.localUpdater, fetcher, options === null || options === void 0 ? void 0 : options.variables);
            this.mutationResult = result;
            this.localUpdater(old => old + 1);
        }
        result.onSuccess = options === null || options === void 0 ? void 0 : options.onSuccess;
        result.onError = options === null || options === void 0 ? void 0 : options.onError;
        result.onCompelete = options === null || options === void 0 ? void 0 : options.onCompelete;
    }
    isSameFetcher(fetcher) {
        if (this.previousFetcher === fetcher) {
            return true;
        }
        const json = fetcher.toJSON();
        if (this.previousFetcherJson === json) {
            return true;
        }
        this.previousFetcher = fetcher;
        this.previousFetcherJson = json;
        return false;
    }
    isSameVariables(variables) {
        var _a;
        if (this.previousVariables === variables) {
            return true;
        }
        const args = Args_1.VariableArgs.of(variables);
        if (((_a = this.previousVariablesArgs) === null || _a === void 0 ? void 0 : _a.key) === (args === null || args === void 0 ? void 0 : args.key)) {
            return true;
        }
        this.previousVariables = variables;
        this.previousVariablesArgs = args;
        return false;
    }
}
exports.MutationResultHolder = MutationResultHolder;
