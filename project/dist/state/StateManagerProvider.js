"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateContext = exports.StateManagerProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const StateManagerImpl_1 = require("./impl/StateManagerImpl");
const Monitor_1 = require("./Monitor");
exports.StateManagerProvider = (0, react_1.memo)(({ stateManager, releasePolicy, children }) => {
    var _a;
    const externalStateManager = (0, react_1.useContext)(exports.stateContext);
    if (externalStateManager !== undefined) {
        throw new Error(`<StateManagerProvider/> is not allowed to be nested`);
    }
    const finallyUsedStateManager = (_a = stateManager) !== null && _a !== void 0 ? _a : new StateManagerImpl_1.StateManagerImpl();
    if (releasePolicy !== undefined) {
        finallyUsedStateManager.releasePolicy = releasePolicy;
    }
    (0, react_1.useEffect)(() => {
        window.__STATE_MANAGER__ = finallyUsedStateManager;
        setTimeout(() => {
            (0, Monitor_1.postStateManagerMessage)(finallyUsedStateManager.id);
        }, 0);
        return () => {
            window.__STATE_MANAGER__ = undefined;
            (0, Monitor_1.postStateManagerMessage)(undefined);
            finallyUsedStateManager.dispose();
        };
    }, [finallyUsedStateManager.id]);
    return ((0, jsx_runtime_1.jsx)(exports.stateContext.Provider, Object.assign({ value: finallyUsedStateManager }, { children: children })));
});
exports.stateContext = (0, react_1.createContext)(undefined);
