"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateScope = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const StateHook_1 = require("./StateHook");
exports.StateScope = react_1.memo(({ name, children }) => {
    const stateManagerImpl = StateHook_1.useStateManager();
    const [scopeReady, setScopeReady] = react_1.useState(false);
    react_1.useEffect(() => {
        const scopedStateManager = stateManagerImpl.registerScope(name);
        setScopeReady(true);
        return () => {
            stateManagerImpl.unregisterScope(scopedStateManager);
        };
    }, []);
    /*
     * The mounting logic of useEffect is executed by wrong order: Child first, parent later.
     *
     * But for scope registration, parent mounted before child is very important,
     * so "scopeReady" is used to guarantee that parent is always mounted before child
     *
     * The unmouting logic has the same problem, please view  "stateManagerImpl.unregisterScope" to know more
     */
    return jsx_runtime_1.jsx(jsx_runtime_1.Fragment, { children: scopeReady && children }, void 0);
});
