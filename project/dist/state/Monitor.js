"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postSimpleStateMessage = exports.postStateManagerMessage = void 0;
function postStateManagerMessage(has, version) {
    const message = {
        messageDomain: "graphQLStateMonitor",
        messageType: "stateManagerChange",
        has,
        version
    };
    postMessage(message, "*");
}
exports.postStateManagerMessage = postStateManagerMessage;
function postSimpleStateMessage(stateValue, changeType, data) {
    var _a, _b, _c;
    if (((_a = window.__GRAPHQL_STATE_MONITORS__) === null || _a === void 0 ? void 0 : _a.simpleState) === true) {
        const message = {
            messageDomain: "graphQLStateMonitor",
            messageType: "simpleStateChange",
            changeType,
            scopePath: stateValue.stateInstance.scopedStateManager.path,
            name: stateValue.stateInstance.state[" $name"],
            parameter: (_c = (_b = stateValue.args) === null || _b === void 0 ? void 0 : _b.key) !== null && _c !== void 0 ? _c : (stateValue.stateInstance.state[" $parameterized"] ? "" : undefined),
            data: changeType === "update" ? data : undefined
        };
        console.log('send', message);
        postMessage(message, "*");
    }
}
exports.postSimpleStateMessage = postSimpleStateMessage;
