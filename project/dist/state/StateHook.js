"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeManagedObjectHooks = exports.useMutation = exports.useQuery = exports.useStateAccessor = exports.useStateValue = exports.useStateManager = void 0;
const react_1 = require("react");
const StateManagerProvider_1 = require("./StateManagerProvider");
const Holder_1 = require("./impl/Holder");
function useStateManager() {
    const stateManager = react_1.useContext(StateManagerProvider_1.stateContext);
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
        if (asyncStyle === "ASYNC_OBJECT") {
            return loadable;
        }
        if (loadable.loading) {
            throw stateValue.result; // throws promise, <Suspense/> will catch it
        }
        if (loadable.error) {
            throw loadable.error;
        }
        if (asyncStyle === "REFRESHABLE_SUSPENSE") {
            return [loadable.data];
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
    const queryResultHolder = useInternalQueryResultHolder(fetcher, undefined, options === null || options === void 0 ? void 0 : options.variables);
    try {
        const queryResult = queryResultHolder.get();
        if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "ASYNC_OBJECT") {
            return queryResult.loadable;
        }
        if (queryResult.loadable.loading) {
            throw queryResult.promise; // throws promise, <Suspense/> will catch it
        }
        if (queryResult.loadable.error) {
            throw queryResult.loadable.error;
        }
        if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "REFRESHABLE_SUSPENSE") {
            return [queryResult.loadable.data];
        }
        return queryResult.loadable.data;
    }
    catch (ex) {
        queryResultHolder.release();
        throw ex;
    }
}
exports.useQuery = useQuery;
function useMutation(fetcher, options) {
    const stateManager = useStateManager();
    const [, setMutationResultVersion] = react_1.useState(0);
    const [holder] = react_1.useState(() => new Holder_1.MutationResultHolder(stateManager, setMutationResultVersion));
    holder.set(fetcher, options);
    const result = holder.get();
    return [result.mutate, result.loadable];
}
exports.useMutation = useMutation;
function makeManagedObjectHooks() {
    return new ManagedObjectHooksImpl();
}
exports.makeManagedObjectHooks = makeManagedObjectHooks;
class ManagedObjectHooksImpl {
    useObject(fetcher, id, options) {
        const queryResultHolder = useInternalQueryResultHolder(fetcher, [id], options === null || options === void 0 ? void 0 : options.variables);
        try {
            const queryResult = queryResultHolder.get();
            if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "ASYNC_OBJECT") {
                return queryResult.loadable;
            }
            if (queryResult.loadable.loading) {
                throw queryResult.promise; // throws promise, <Suspense/> will catch it
            }
            if (queryResult.loadable.error) {
                throw queryResult.loadable.error;
            }
            if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "REFRESHABLE_SUSPENSE") {
                return [queryResult.loadable.data];
            }
            return queryResult.loadable.data;
        }
        catch (ex) {
            queryResultHolder.release();
            throw ex;
        }
    }
    useObjects(fetcher, ids, options) {
        const queryResultHolder = useInternalQueryResultHolder(fetcher, ids, options === null || options === void 0 ? void 0 : options.variables);
        try {
            const queryResult = queryResultHolder.get();
            if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "ASYNC_OBJECT") {
                return queryResult.loadable;
            }
            if (queryResult.loadable.loading) {
                throw queryResult.promise; // throws promise, <Suspense/> will catch it
            }
            if (queryResult.loadable.error) {
                throw queryResult.loadable.error;
            }
            if ((options === null || options === void 0 ? void 0 : options.asyncStyle) === "REFRESHABLE_SUSPENSE") {
                return [queryResult.loadable.data];
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
    const [, setStateValueVersion] = react_1.useState(0);
    const [stateValueHolder] = react_1.useState(() => new Holder_1.StateValueHolder(stateManager, setStateValueVersion));
    stateValueHolder.set(state, options);
    react_1.useEffect(() => {
        return () => {
            stateValueHolder.release();
        };
    }, [stateValueHolder]);
    return stateValueHolder;
}
function useInternalQueryResultHolder(fetcher, ids, variables) {
    const stateManager = useStateManager();
    const [, setQueryResultVersion] = react_1.useState(0);
    const [queryResultHolder] = react_1.useState(() => new Holder_1.QueryResultHolder(stateManager, setQueryResultVersion));
    queryResultHolder.set(fetcher, ids, variables);
    react_1.useEffect(() => {
        return () => {
            queryResultHolder.release();
        };
    }, [queryResultHolder]);
    return queryResultHolder;
}
