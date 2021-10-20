import { standardizedVariables } from "../state/impl/Variables";

export class VariableArgs {

    private constructor(readonly variables: any, readonly key: string) {}

    constains(args: VariableArgs): boolean {
        return contains(this.variables, args.variables);
    }

    static of(variables: any): VariableArgs | undefined {
        if (variables === undefined) {
            return undefined;
        }
        const vs = standardizedVariables(variables);
        const vsCode = JSON.stringify(vs);
        if (vsCode === "{}") {
            return undefined;
        }
        return new VariableArgs(vs, vsCode);
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
        return contains(left.variables, right.variables)
    }

    static fieldKey(fieldName: string, args?: VariableArgs): string {
        if (args === undefined) {
            return fieldName;
        }
        return `${fieldName}:${args.key}`;
    }
}

function contains(variables1: any, variables2: any): boolean {
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
