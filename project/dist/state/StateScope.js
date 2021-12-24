"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScopePath = exports.StateScope = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
exports.StateScope = (0, react_1.memo)(({ name, children }) => {
    var _a;
    const path = (_a = (0, react_1.useContext)(pathContext)) !== null && _a !== void 0 ? _a : "";
    return ((0, jsx_runtime_1.jsx)(pathContext.Provider, Object.assign({ value: `${path}/${name}` }, { children: children }), void 0));
});
function useScopePath() {
    var _a;
    return (_a = (0, react_1.useContext)(pathContext)) !== null && _a !== void 0 ? _a : "/";
}
exports.useScopePath = useScopePath;
const pathContext = (0, react_1.createContext)(undefined);
