"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.standardizedVariablesKeys = exports.standardizedVariables = void 0;
function standardizedVariables(variables) {
    const subKeys = standardizedVariablesKeys(variables);
    if (subKeys === undefined) {
        return undefined;
    }
    const standardizedVariables = {};
    for (const subKey of subKeys) {
        standardizedVariables[subKey] = variables[subKey];
    }
    return standardizedVariables;
}
exports.standardizedVariables = standardizedVariables;
function standardizedVariablesKeys(variables) {
    if (variables === undefined || variables === null) {
        return undefined;
    }
    if (typeof variables !== "object" || Array.isArray(variables)) {
        throw new Error("variables must be plain object");
    }
    const subKeys = [];
    for (const subKey in variables) {
        if (typeof subKey !== "string") {
            throw new Error("key of variables must string");
        }
        if (variables[subKey] !== undefined) {
            subKeys.push(subKey);
        }
    }
    if (subKeys.length === 0) {
        return undefined;
    }
    subKeys.sort();
    return subKeys;
}
exports.standardizedVariablesKeys = standardizedVariablesKeys;
