"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableArgs = void 0;
const Variables_1 = require("../state/impl/Variables");
class VariableArgs {
    constructor(variables, key) {
        this.variables = variables;
        this.key = key;
    }
    constains(args) {
        return contains(this.variables, args.variables);
    }
    static of(variables) {
        if (variables === undefined) {
            return undefined;
        }
        const vs = Variables_1.standardizedVariables(variables);
        const vsCode = JSON.stringify(vs);
        if (vsCode === "{}") {
            return undefined;
        }
        return new VariableArgs(vs, vsCode);
    }
    static contains(left, right) {
        if (left === right) {
            return true;
        }
        if (left === undefined) {
            return false;
        }
        if (right === undefined) {
            return true;
        }
        return contains(left.variables, right.variables);
    }
    static fieldKey(fieldName, args) {
        if (args === undefined) {
            return fieldName;
        }
        return `${fieldName}:${args.key}`;
    }
}
exports.VariableArgs = VariableArgs;
function contains(variables1, variables2) {
    for (const name in variables2) {
        const value2 = variables2[name];
        const value1 = variables1[name];
        if (!valueEqual(value1, value2)) {
            return false;
        }
    }
    return true;
}
function valueEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (a === undefined || b === undefined) {
        return false;
    }
    return JSON.stringify(a) === JSON.stringify(b);
}
