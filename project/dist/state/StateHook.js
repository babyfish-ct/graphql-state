"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeManagedObjectHooks = exports.useStateAsyncValue = exports.useStateWriter = exports.useStateValue = exports.useStateManager = void 0;
const react_1 = require("react");
const StateManagerProvider_1 = require("./StateManagerProvider");
const Shape_1 = require("../meta/Shape");
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
    throw new Error();
}
exports.useStateValue = useStateValue;
function useStateWriter(state, options) {
    throw new Error();
}
exports.useStateWriter = useStateWriter;
function useStateAsyncValue(state, options) {
    const stateValue = useInternalStateValue(state, options);
    throw new Error();
}
exports.useStateAsyncValue = useStateAsyncValue;
function makeManagedObjectHooks() {
    throw new Error();
}
exports.makeManagedObjectHooks = makeManagedObjectHooks;
function useInternalStateValue(state, options) {
    var _a;
    const stateManager = useStateManager();
    const stateInstance = stateManager.scope.instance(state, (_a = options === null || options === void 0 ? void 0 : options.propagation) !== null && _a !== void 0 ? _a : "REQUIRED");
    const [vs, vsKey] = react_1.useMemo(() => {
        const variables = Variables_1.standardizedVariables(options === null || options === void 0 ? void 0 : options.variables);
        return [variables, variables !== undefined ? JSON.stringify(variables) : undefined];
    }, [options === null || options === void 0 ? void 0 : options.variables]);
    react_1.useEffect(() => {
        stateInstance.retain(vsKey, vs);
        return () => {
            stateInstance.release(vsKey);
        };
    }, [stateInstance, vsKey]);
    return stateInstance.get(Shape_1.variables);
}
