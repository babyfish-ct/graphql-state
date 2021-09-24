"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeManagedObjectHooks = exports.useStateAccessor = exports.useStateValue = exports.useStateManager = void 0;
const react_1 = require("react");
const StateManagerProvider_1 = require("./StateManagerProvider");
function useStateManager() {
    const stateManager = react_1.useContext(StateManagerProvider_1.stateContext);
    if (stateManager === undefined) {
        throw new Error("'useStateManager' cannoly be used under <StateManagerProvider/>");
    }
    return stateManager;
}
exports.useStateManager = useStateManager;
function useStateValue(state, options) {
    throw new Error();
}
exports.useStateValue = useStateValue;
function useStateAccessor(state, options) {
    throw new Error();
}
exports.useStateAccessor = useStateAccessor;
function makeManagedObjectHooks() {
    throw new Error();
}
exports.makeManagedObjectHooks = makeManagedObjectHooks;
