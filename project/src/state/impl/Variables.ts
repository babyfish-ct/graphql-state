export function standardizedVariables(variables: any): any {
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

export function standardizedVariablesKeys(variables: any): string[] | undefined {
    if (variables === undefined || variables === null) {
        return undefined;
    }
    if (typeof variables !== "object" || Array.isArray(variables)) {
        throw new Error("variables must be plain object");
    }
    const subKeys: string[] = [];
    for (const subKey in variables) {
        if (typeof subKey !== "string") {
            throw new Error("key of variables must string");
        }
        subKeys.push(subKey);
    }
    if (subKeys.length === 0) {
        return undefined;
    }
    subKeys.sort();
    return subKeys;
}
