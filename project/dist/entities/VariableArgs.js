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
            return VariableArgs.EMPTY_ARGS;
        }
        const vs = Variables_1.standardizedVariables(variables);
        const vsCode = JSON.stringify(vs);
        if (vsCode === "{}") {
            return VariableArgs.EMPTY_ARGS;
        }
        return new VariableArgs(vs, vsCode);
    }
}
exports.VariableArgs = VariableArgs;
VariableArgs.EMPTY_ARGS = new VariableArgs();
function contains(variables1, variables2) {
    if (variables2 === undefined) {
        return true;
    }
    if (variables1 === undefined) {
        return false;
    }
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
