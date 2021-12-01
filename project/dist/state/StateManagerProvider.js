"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateContext = exports.StateManagerProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const StateManagerImpl_1 = require("./impl/StateManagerImpl");
const Monitor_1 = require("./Monitor");
exports.StateManagerProvider = react_1.memo(({ stateManager, releasePolicy, children }) => {
    var _a;
    const externalStateManager = react_1.useContext(exports.stateContext);
    if (externalStateManager !== undefined) {
        throw new Error(`<StateManagerProvider/> is not allowed to be nested`);
    }
    const finallyUsedStateManager = (_a = stateManager) !== null && _a !== void 0 ? _a : new StateManagerImpl_1.StateManagerImpl();
    if (releasePolicy !== undefined) {
        finallyUsedStateManager.releasePolicy = releasePolicy;
    }
    react_1.useEffect(() => {
        const version = stateManagerVersion++;
        window.__STATE_MANAGER__ = finallyUsedStateManager;
        Monitor_1.postStateManagerMessage(true, version);
        return () => {
            window.__STATE_MANAGER__ = undefined;
            Monitor_1.postStateManagerMessage(false, version);
            finallyUsedStateManager.dispose();
        };
    }, [stateManager]);
    return (jsx_runtime_1.jsx(exports.stateContext.Provider, Object.assign({ value: finallyUsedStateManager }, { children: children }), void 0));
});
exports.stateContext = react_1.createContext(undefined);
let stateManagerVersion = 0;
