"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateScope = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const StateHook_1 = require("./StateHook");
exports.StateScope = react_1.memo(({ children }) => {
    const stateManagerImpl = StateHook_1.useStateManager();
    const [scopedStateManager] = react_1.useState(() => stateManagerImpl.createScope());
    return stateManagerImpl.usingScope(scopedStateManager, () => {
        return (jsx_runtime_1.jsx(jsx_runtime_1.Fragment, { children: children }, void 0));
    });
});
