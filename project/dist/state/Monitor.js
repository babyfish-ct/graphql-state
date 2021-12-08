"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEvictLogEnabled = exports.postGraphStateMessage = exports.postSimpleStateMessage = exports.postStateManagerMessage = void 0;
function postStateManagerMessage(stateManagerId) {
    const message = {
        messageDomain: "graphQLStateMonitor",
        messageType: "stateManagerChange",
        stateManagerId
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
            stateManagerId: stateValue.stateInstance.scopedStateManager.stateManager.id,
            changeType,
            scopePath: stateValue.stateInstance.scopedStateManager.path,
            name: stateValue.stateInstance.state[" $name"],
            parameter: (_c = (_b = stateValue.args) === null || _b === void 0 ? void 0 : _b.key) !== null && _c !== void 0 ? _c : (stateValue.stateInstance.state[" $parameterized"] ? "" : undefined),
            data: changeType === "update" ? data : undefined
        };
        postMessage(message, "*");
    }
}
exports.postSimpleStateMessage = postSimpleStateMessage;
function postGraphStateMessage(stateManagerId, event) {
    var _a;
    if (((_a = window.__GRAPHQL_STATE_MONITORS__) === null || _a === void 0 ? void 0 : _a.graphState) === true) {
        const fields = [];
        if (event.eventType === "evict") {
            for (const key of event.evictedKeys) {
                const fieldKey = fieldKeyOf(key);
                const field = {
                    fieldKey,
                    oldValue: event.evictedValue(key)
                };
                fields.push(field);
            }
        }
        else {
            for (const key of event.changedKeys) {
                const fieldKey = fieldKeyOf(key);
                const field = {
                    fieldKey,
                    oldValue: event.changedType === 'insert' ? undefined : event.oldValue(key),
                    newValue: event.changedType === 'delete' ? undefined : event.newValue(key)
                };
                fields.push(field);
            }
        }
        const message = {
            messageDomain: "graphQLStateMonitor",
            messageType: "graphStateChange",
            stateManagerId,
            changeType: event.eventType === 'evict' ?
                (event.evictedType === 'row' ? 'evict-row' : 'evict-fields') :
                event.changedType,
            typeName: event.typeName,
            id: event.id,
            fields
        };
        postMessage(message, "*");
    }
}
exports.postGraphStateMessage = postGraphStateMessage;
function isEvictLogEnabled() {
    var _a;
    return ((_a = window.__GRAPHQL_STATE_MONITORS__) === null || _a === void 0 ? void 0 : _a.evictLog) === true;
}
exports.isEvictLogEnabled = isEvictLogEnabled;
function fieldKeyOf(key) {
    if (typeof key === 'string') {
        return key;
    }
    if (key.variables === undefined || key.variables === null) {
        return key.name;
    }
    const parameter = JSON.stringify(key.variables);
    if (parameter === '{}') {
        return key.name;
    }
    return `${key.name}:${parameter}`;
}
