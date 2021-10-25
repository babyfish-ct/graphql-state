"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateContext = exports.StateManagerProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const StateManagerImpl_1 = require("./impl/StateManagerImpl");
exports.StateManagerProvider = react_1.memo(({ stateManager, children }) => {
    return (jsx_runtime_1.jsx(exports.stateContext.Provider, Object.assign({ value: stateManager !== null && stateManager !== void 0 ? stateManager : defaultStateManager }, { children: children }), void 0));
});
exports.stateContext = react_1.createContext(undefined);
const defaultStateManager = new StateManagerImpl_1.StateManagerImpl();
