import { standardizedVariables } from "../state/impl/Variables";

export class VariableArgs {

    private static readonly EMPTY_ARGS = new VariableArgs();

    private constructor(readonly variables?: any, readonly key?: string) {}

    constains(args: VariableArgs): boolean {
        return contains(this.variables, args.variables);
    }

    static of(variables: any): VariableArgs {
        if (variables === undefined) {
            return VariableArgs.EMPTY_ARGS;
        }
        const vs = standardizedVariables(variables);
        const vsCode = JSON.stringify(vs);
        if (vsCode === "{}") {
            return VariableArgs.EMPTY_ARGS;
        }
        return new VariableArgs(vs, vsCode);
    }
}

function contains(variables1: any, variables2: any): boolean {
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

function valueEqual(a: any, b: any) {
    if (a === b) {
        return true;
    }
    if (a === undefined || b === undefined) {
        return false;
    }
    return JSON.stringify(a) === JSON.stringify(b);
}
