"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateContext = exports.StateManagerProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const StateManagerImpl_1 = require("./impl/StateManagerImpl");
exports.StateManagerProvider = react_1.memo(({ stateManager, children }) => {
    var _a;
    const externalStateManager = react_1.useContext(exports.stateContext);
    if (externalStateManager !== undefined) {
        throw new Error(`<StateManagerProvider/> is not allowed to be nested`);
    }
    const finallyUsedStateManager = (_a = stateManager) !== null && _a !== void 0 ? _a : new StateManagerImpl_1.StateManagerImpl();
    // Use this to debug before chrome extension to visualize the data is supported in the future
    window.__STATE_MANAGER__ = finallyUsedStateManager;
    react_1.useEffect(() => {
        return () => {
            window.__STATE_MANAGER__ = undefined;
            finallyUsedStateManager.dispose();
        };
    }, [finallyUsedStateManager]);
    return (jsx_runtime_1.jsx(exports.stateContext.Provider, Object.assign({ value: finallyUsedStateManager }, { children: children }), void 0));
});
exports.stateContext = react_1.createContext(undefined);
