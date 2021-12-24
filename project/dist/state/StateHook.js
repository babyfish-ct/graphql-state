"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeManagedObjectHooks = exports.useMutation = exports.usePaginationQuery = exports.useQuery = exports.useStateAccessor = exports.useStateValue = exports.useStateManager = void 0;
const react_1 = require("react");
const StateManagerProvider_1 = require("./StateManagerProvider");
const Holder_1 = require("./impl/Holder");
const StateScope_1 = require("./StateScope");
function useStateManager() {
    const stateManager = (0, react_1.useContext)(StateManagerProvider_1.stateContext);
    if (stateManager === undefined) {
        throw new Error("'useStateManager' cannoly be used under <StateManagerProvider/>");
    }
    return stateManager;
}
exports.useStateManager = useStateManager;
function useStateValue(state, options) {
    var _a;
    const stateValueHolder = useInternalStateValueHolder(state, options);
    try {
        const stateValue = stateValueHolder.get();
        if (state[" $stateType"] !== "ASYNC") {
            return stateValue.result;
        }
        const loadable = stateValue.loadable;
        const asyncStyle = (_a = options) === null || _a === void 0 ? void 0 : _a.asyncStyle;
        if (asyncStyle === "async-object") {
            return loadable;
        }
        if (loadable.loading) {
            throw stateValue.result; // throws promise, <suspense/> will catch it
        }
        if (loadable.error) {
            throw loadable.error;
        }
        if (asyncStyle === "refetchable-suspense") {
            return [loadable.data, loadable.refetch];
        }
        return loadable.data;
    }
    catch (ex) {
        stateValueHolder.release();
        throw ex;
    }
}
exports.useStateValue = useStateValue;
function useStateAccessor(state, options) {
    const stateValueHolder = useInternalStateValueHolder(state, options);
    try {
        const stateValue = stateValueHolder.get();
        return stateValue.accessor;
    }
    catch (ex) {
        stateValueHolder.release();
        throw ex;
    }
}
exports.useStateAccessor = useStateAccessor;
function useQuery(fetcher, options) {
    const queryResultHolder = useInternalQueryResultHolder(fetcher, undefined, undefined, options);
    try {
        const queryResult = queryResultHolder.get();
        if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "async-object") {
            return queryResult.loadable;
        }
        if (queryResult.loadable.loading) {
            throw queryResult.promise; // throws promise, <suspense/> will catch it
        }
        if (queryResult.loadable.error) {
            throw queryResult.loadable.error;
        }
        if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "refetchable-suspense") {
            return {
                data: queryResult.loadable.data,
                refetch: queryResult.loadable.refetch
            };
        }
        return queryResult.loadable.data;
    }
    catch (ex) {
        queryResultHolder.release();
        throw ex;
    }
}
exports.useQuery = useQuery;
function usePaginationQuery(fetcher, options) {
    const queryResultHolder = useInternalQueryResultHolder(fetcher, options === null || options === void 0 ? void 0 : options.windowId, undefined, options);
    try {
        const queryResult = queryResultHolder.get();
        if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "async-object") {
            return queryResult.loadable;
        }
        if (queryResult.loadable.loading) {
            throw queryResult.promise; // throws promise, <suspense/> will catch it
        }
        if (queryResult.loadable.error) {
            throw queryResult.loadable.error;
        }
        return queryResult.loadable;
    }
    catch (ex) {
        queryResultHolder.release();
        throw ex;
    }
}
exports.usePaginationQuery = usePaginationQuery;
function useMutation(fetcher, options) {
    const stateManager = useStateManager();
    const [, setMutationResultVersion] = (0, react_1.useState)(0);
    const [holder] = (0, react_1.useState)(() => new Holder_1.MutationResultHolder(stateManager, setMutationResultVersion));
    holder.set(fetcher, options);
    const result = holder.get();
    return {
        mutate: result.mutate,
        data: result.loadable.data,
        loading: result.loadable.loading,
        error: result.loadable.error,
    };
}
exports.useMutation = useMutation;
function makeManagedObjectHooks() {
    return new ManagedObjectHooksImpl();
}
exports.makeManagedObjectHooks = makeManagedObjectHooks;
class ManagedObjectHooksImpl {
    useObject(fetcher, id, options) {
        const queryResultHolder = useInternalQueryResultHolder(fetcher, undefined, [id], options);
        try {
            const queryResult = queryResultHolder.get();
            if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "async-object") {
                return Object.assign(Object.assign({}, queryResult.loadable), { data: queryResult.loadable.data !== undefined ? queryResult.loadable.data[0] : undefined });
            }
            if (queryResult.loadable.loading) {
                throw queryResult.promise; // throws promise, <suspense/> will catch it
            }
            if (queryResult.loadable.error) {
                throw queryResult.loadable.error;
            }
            if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "refetchable-suspense") {
                return {
                    data: queryResult.loadable.data[0],
                    refetch: queryResult.loadable.refetch
                };
            }
            return queryResult.loadable.data[0];
        }
        catch (ex) {
            queryResultHolder.release();
            throw ex;
        }
    }
    useObjects(fetcher, ids, options) {
        const queryResultHolder = useInternalQueryResultHolder(fetcher, undefined, ids, options);
        try {
            const queryResult = queryResultHolder.get();
            if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "async-object") {
                return queryResult.loadable;
            }
            if (queryResult.loadable.loading) {
                throw queryResult.promise; // throws promise, <suspense/> will catch it
            }
            if (queryResult.loadable.error) {
                throw queryResult.loadable.error;
            }
            if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "refetchable-suspense") {
                return {
                    data: queryResult.loadable.data,
                    refetch: queryResult.loadable.refetch
                };
            }
            return queryResult.loadable.data;
        }
        catch (ex) {
            queryResultHolder.release();
            throw ex;
        }
    }
}
function useInternalStateValueHolder(state, options) {
    const stateManager = useStateManager();
    const [, setStateValueVersion] = (0, react_1.useState)(0);
    const scopePath = (0, StateScope_1.useScopePath)();
    const stateValueHolder = (0, react_1.useMemo)(() => {
        return new Holder_1.StateValueHolder(stateManager, scopePath, setStateValueVersion);
    }, [stateManager, scopePath, setStateValueVersion]);
    stateValueHolder.set(state, scopePath, options);
    (0, react_1.useEffect)(() => {
        return () => {
            stateValueHolder.release();
        };
    }, [stateValueHolder]);
    return stateValueHolder;
}
function useInternalQueryResultHolder(fetcher, windowId, ids, options) {
    const stateManager = useStateManager();
    const [, setQueryResultVersion] = (0, react_1.useState)(0);
    const queryResultHolder = (0, react_1.useMemo)(() => {
        return new Holder_1.QueryResultHolder(stateManager, setQueryResultVersion);
    }, [stateManager, setQueryResultVersion]);
    queryResultHolder.set(fetcher, windowId, ids, options);
    (0, react_1.useEffect)(() => {
        return () => {
            queryResultHolder.release();
        };
    }, [queryResultHolder]);
    return queryResultHolder;
}
