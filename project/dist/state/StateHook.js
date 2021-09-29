"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeManagedObjectHooks = exports.useStateAsyncValue = exports.useStateAccessor = exports.useStateValue = exports.useStateManager = void 0;
const react_1 = require("react");
const StateManagerProvider_1 = require("./StateManagerProvider");
const Variables_1 = require("./impl/Variables");
function useStateManager() {
    const stateManager = react_1.useContext(StateManagerProvider_1.stateContext);
    if (stateManager === undefined) {
        throw new Error("'useStateManager' cannoly be used under <StateManagerProvider/>");
    }
    return stateManager;
}
exports.useStateManager = useStateManager;
function useStateValue(state, options) {
    const stateValue = useInternalStateValue(state, options);
    if (state[" $stateType"] !== "ASYNC") {
        return stateValue.result;
    }
    const loadable = stateValue.loadable;
    if (loadable.loading) {
        throw stateValue.result; // throws promise, <Suspense/> will catch it
    }
    if (loadable.error) {
        throw loadable.error;
    }
    return loadable.data;
}
exports.useStateValue = useStateValue;
function useStateAccessor(state, options) {
    const stateValue = useInternalStateValue(state, options);
    return stateValue.accessor;
}
exports.useStateAccessor = useStateAccessor;
function useStateAsyncValue(state, options) {
    const stateValue = useInternalStateValue(state, options);
    return stateValue.loadable;
}
exports.useStateAsyncValue = useStateAsyncValue;
function makeManagedObjectHooks() {
    throw new Error();
}
exports.makeManagedObjectHooks = makeManagedObjectHooks;
function useInternalStateValue(state, options) {
    var _a, _b;
    const stateManager = useStateManager();
    const stateInstance = stateManager.scope.instance(state, (_a = options === null || options === void 0 ? void 0 : options.propagation) !== null && _a !== void 0 ? _a : "REQUIRED");
    const [vs, vsKey] = react_1.useMemo(() => {
        var _a;
        const svs = Variables_1.standardizedVariables((_a = options) === null || _a === void 0 ? void 0 : _a.variables);
        return [svs, svs !== undefined ? JSON.stringify(svs) : undefined];
    }, [(_b = options) === null || _b === void 0 ? void 0 : _b.variables]);
    const [, setStateVerion] = react_1.useState(0);
    const stateValue = react_1.useMemo(() => {
        return stateInstance.retain(vsKey, vs);
    }, [vsKey, vs]);
    react_1.useEffect(() => {
        return () => {
            stateInstance.release(vsKey);
        };
    }, [stateInstance, vsKey]);
    react_1.useEffect(() => {
        const stateValueChange = (e) => {
            if (e.stateValue === stateValue) {
                setStateVerion(old => old + 1); // Change a local state to update react component
            }
        };
        stateManager.addStateChangeListener(stateValueChange);
        return () => {
            stateManager.removeStateChangeListener(stateValueChange);
        };
    }, [stateManager, stateValue]);
    return stateValue;
}
