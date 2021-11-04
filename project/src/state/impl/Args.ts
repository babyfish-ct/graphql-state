import { GRAPHQL_STATE_PAGINATION_INFO } from "../../entities/PaginationFetcherProcessor";
import { PaginationInfo } from "../../entities/QueryArgs";

export class OptionArgs {

    private _variableArgs?: VariableArgs;

    private constructor(readonly options: any, readonly key: string) {
        this._variableArgs = VariableArgs.of(options?.variables);
    }

    get variableArgs(): VariableArgs | undefined {
        return this._variableArgs;
    }

    static of(options: any): OptionArgs | undefined {
        const standardizedOptions = standardizedValue(options);
        if (standardizedOptions === undefined) {
            return undefined;
        }
        return new OptionArgs(
            standardizedOptions,
            JSON.stringify(standardizedOptions) 
        );
    }
}

export class VariableArgs {

    readonly filterArgs?: VariableArgs;

    readonly paginationInfo?: PaginationInfo;

    private constructor(
        readonly variables: any, 
        readonly key: string
    ) {
        this.paginationInfo = variables[GRAPHQL_STATE_PAGINATION_INFO];
        if (this.paginationInfo === undefined) {
            this.filterArgs = this;
        } else {
            const obj = {};
            let hasValue = false;
            for (const key in variables) {
                if (key !== GRAPHQL_STATE_PAGINATION_INFO) {
                    obj[key] = variables[key];
                    hasValue = true;
                }
            }
            this.filterArgs = hasValue ? new VariableArgs(obj, JSON.stringify(obj)) : undefined;
        }
    }

    get filterVariables(): any {
        return this.filterArgs?.variables;
    }

    constains(args: VariableArgs): boolean {
        return variableContains(this.variables, args.variables);
    }

    static of(variables: any): VariableArgs | undefined {
        if (variables === undefined) {
            return undefined;
        }
        const standardizedVariables = standardizedValue(variables);
        if (standardizedVariables === undefined) {
            return undefined;
        }
        return new VariableArgs(
            standardizedVariables, 
            JSON.stringify(standardizedVariables)
        );
    }

    static contains(
        left: VariableArgs | undefined, 
        right: VariableArgs | undefined
    ): boolean {
        if (left === right) {
            return true;
        }
        if (left === undefined) {
            return false;
        }
        if (right === undefined) {
            return true;
        }
        return variableContains(left.variables, right.variables)
    }

    static fieldKey(fieldName: string, args?: VariableArgs): string {
        if (args === undefined) {
            return fieldName;
        }
        return `${fieldName}:${args.key}`;
    }
}

function variableContains(variables1: any, variables2: any): boolean {
    for (const name in variables2) {
        const value2 = variables2[name];
        const value1 = variables1[name];
        if (!variableValueEqual(value1, value2)) {
            return false;
        }
    }
    return true;
}

function variableValueEqual(a: any, b: any) {
    if (a === b) {
        return true;
    }
    if (a === undefined || b === undefined) {
        return false;
    }
    return JSON.stringify(a) === JSON.stringify(b);
}

function standardizedValue(value: any): any | undefined {
    return standardizedValue0(value, true);
}

function standardizedValue0(value: any, emptyObjectToUndefined: boolean): any | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    if (typeof value === "object") {
        if (Array.isArray(value)) {
            return value.map(element => standardizedValue0(element, false));
        }
        return standardizedObject(value, emptyObjectToUndefined);
    }
    return value;
}

function standardizedObject(obj: any, emptyObjectToUndefined: boolean): any | undefined {
    const keys: string[] = [];
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

