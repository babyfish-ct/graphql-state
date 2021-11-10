"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableArgs = exports.OptionArgs = void 0;
const PaginationFetcherProcessor_1 = require("../../entities/PaginationFetcherProcessor");
class OptionArgs {
    constructor(options, key) {
        this.options = options;
        this.key = key;
        this._variableArgs = VariableArgs.of(options === null || options === void 0 ? void 0 : options.variables);
    }
    get variableArgs() {
        return this._variableArgs;
    }
    static of(options) {
        const standardizedOptions = standardizedValue(options);
        if (standardizedOptions === undefined) {
            return undefined;
        }
        return new OptionArgs(standardizedOptions, JSON.stringify(standardizedOptions));
    }
}
exports.OptionArgs = OptionArgs;
class VariableArgs {
    constructor(variables, key) {
        this.variables = variables;
        this.key = key;
        this.paginationInfo = variables[PaginationFetcherProcessor_1.GRAPHQL_STATE_PAGINATION_INFO];
        if (this.paginationInfo === undefined) {
            this.filterArgs = this;
        }
        else {
            const obj = {};
            let hasValue = false;
            for (const key in variables) {
                if (key !== PaginationFetcherProcessor_1.GRAPHQL_STATE_PAGINATION_INFO) {
                    obj[key] = variables[key];
                    hasValue = true;
                }
            }
            this.filterArgs = hasValue ? new VariableArgs(obj, JSON.stringify(obj)) : undefined;
        }
    }
    get filterVariables() {
        var _a;
        return (_a = this.filterArgs) === null || _a === void 0 ? void 0 : _a.variables;
    }
    constains(args) {
        return variableContains(this.variables, args.variables);
    }
    static of(variables) {
        if (variables === undefined) {
            return undefined;
        }
        const standardizedVariables = standardizedValue(variables);
        if (standardizedVariables === undefined) {
            return undefined;
        }
        return new VariableArgs(standardizedVariables, JSON.stringify(standardizedVariables));
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
        return variableContains(left.variables, right.variables);
    }
    static fieldKey(fieldName, args) {
        if (args === undefined) {
            return fieldName;
        }
        return `${fieldName}:${args.key}`;
    }
}
exports.VariableArgs = VariableArgs;
function variableContains(variables1, variables2) {
    for (const name in variables2) {
        const value2 = variables2[name];
        const value1 = variables1[name];
        if (!variableValueEqual(value1, value2)) {
            return false;
        }
    }
    return true;
}
function variableValueEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (a === undefined || b === undefined) {
        return false;
    }
    return JSON.stringify(a) === JSON.stringify(b);
}
function standardizedValue(value) {
    return standardizedValue0(value, true);
}
function standardizedValue0(value, emptyObjectToUndefined) {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value === "function") {
        throw new Error("Internal bug: Cannot standardize json with function");
    }
    if (typeof value === "object") {
        if (Array.isArray(value)) {
            return value.map(element => standardizedValue0(element, false));
        }
        return standardizedObject(value, emptyObjectToUndefined);
    }
    return value;
}
function standardizedObject(obj, emptyObjectToUndefined) {
    const keys = [];
    const result = {};
    for (const key in obj) {
        const value = standardizedValue0(obj[key], true);
        if (value !== undefined && value !== null) {
            result[key] = value;
            keys.push(key);
        }
    }
    if (keys.length === 0) {
        return emptyObjectToUndefined ? undefined : result;
    }
    if (keys.length === 1) {
        return result;
    }
    keys.sort();
    const sortedResult = {};
    for (const key of keys) {
        sortedResult[key] = result[key];
    }
    return sortedResult;
}
