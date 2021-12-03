import { Draft } from "immer";
import { SimpleState, SimpleStateScope } from "./Model";

// Returns the index of the search key, if it is contained in the list; 
// otherwise, (-(insertion point) - 1)
export function binarySearch<
    T, 
    TField extends keyof T
>(
    arr: ReadonlyArray<T>, 
    field: TField,
    value: T[TField]
): number {

    // This code is cloned from java.util.Collections.indexedBinarySearch
    let low = 0;
    let high = arr.length - 1;

    while (low <= high) {
        const mid = (low + high) >>> 1;
        const midVal = arr[mid][field];
        if (midVal < value) {
            low = mid + 1;
        }
        else if (midVal > value) {
            high = mid - 1;
        }
        else {
            return mid; 
        }
    }
    return -(low + 1); 
}

export function getOrCreateScopeByPath(
    rootScope: Draft<SimpleStateScope>, 
    path: string,
): Draft<SimpleStateScope> {
    let scope = rootScope;
    for (const name of path.split(/\s*\/\s*/)) {
        if (name !== "") {
            const index = binarySearch(scope.scopes, "name", name);
            if (index < 0) {
                const child = {
                    name,
                    states: [],
                    scopes: []
                };
                scope.scopes.splice(-index - 1, 0, child);
                scope = child;
            } else {
                scope = scope.scopes[index];
            }
        }
    }
    return scope;
}

export function removeScopeByPath(
    rootScope: Draft<SimpleStateScope>, 
    path: string
) {
    let parent = rootScope;
    let childIndex = 0;
    let child = parent;
    for (const name of path.split(/\s*\/\s*/)) {
        if (name !== "") {
            parent = child;
            childIndex = binarySearch(parent.scopes, "name", name);
            if (childIndex < 0) {
                return;
            }
            child = parent.scopes[childIndex];
        }
    }
    if (child !== rootScope) {
        parent.scopes.splice(childIndex, 1);
    }
}

export function setScopeValue(
    scope: Draft<SimpleStateScope>,
    name: string,
    parameter: string | undefined,
    value: any
) {
    const stateIndex = binarySearch(scope.states, "name", name);
    let state: Draft<SimpleState>;
    if (stateIndex < 0) {
        state = {
            name,
            parameterizedValues: parameter !== undefined ? [] : undefined
        };
        scope.states.splice(-stateIndex - 1, 0, state);    
    } else {
        state = scope.states[stateIndex];
    }
    if (parameter === undefined) {
        state.value = value;
    } else {
        const paramIndex = binarySearch(state.parameterizedValues!, "parameter", parameter);
        if (paramIndex < 0) {
            state.parameterizedValues!.splice(-paramIndex - 1, 0, { parameter, value });
        } else {
            state.parameterizedValues![paramIndex].value = value;
        }
    }
}

export function visitScope(
    scope: SimpleStateScope,
    visitor: {
        readonly scope?: (path: string, scope: SimpleStateScope) => void,
        readonly state?: (path: string, state: SimpleState) => void
    }
) {
    visitScope0("/", scope, visitor);
}

export function visitScope0(
    path: string,
    scope: SimpleStateScope,
    visitor: {
        readonly scope?: (path: string, scope: SimpleStateScope) => void,
        readonly state?: (path: string, state: SimpleState) => void
    }
) {
    const childPath = childPathOf(path, scope.name, true);
    if (visitor.scope !== undefined) {
        visitor.scope(childPath, scope);
    }
    if (visitor.state !== undefined) {
        for (const state of scope.states) {
            visitor.state(childPathOf(childPath, state.name, false), state);
        }
    }
    for (const child of scope.scopes) {
        visitScope0(childPath, child, visitor);
    }
}

export function childPathOf(path: string, childName: string, isChildScope: boolean): string {
    const name = isChildScope ? 
        (childName === "" ? "scope(::)" : `scope(${childName})`) : 
        childName
    ;
    if (path === "" || path === "/") {
        return `/${name}`;
    }
    return `${path}/${name}`;
}

export function findValueRefByPath(rootScope: SimpleStateScope, mixedPath: string): ValueRef | undefined {
    const names = mixedPath.split(/\s*\/\s*/);
    let scope = rootScope;
    let nameIndex = 0;
    while (nameIndex < names.length) {
        const name = names[nameIndex];
        if (name === "") {
            nameIndex++;
            continue;
        }
        if (!name.startsWith("scope(")) {
            break;
        }
        let scopeName = name.substring(6, name.length - 1);
        if (scopeName === "::") {
            nameIndex++;
            continue;
        }
        const index = binarySearch(scope.scopes, "name", scopeName);
        if (index < 0) {
            return undefined;
        }
        scope = scope.scopes[index];
        nameIndex++;
    }
    if (nameIndex + 1 !== names.length) {
        return undefined;
    }
    const lastName = names[names.length - 1];
    const colonIndex = lastName.indexOf(":");
    let stateName: string;
    let parameter: string;
    if (colonIndex === -1) {
        stateName = lastName;
        parameter = "";
    } else {
        stateName = lastName.substring(0, colonIndex);
        parameter = lastName.substring(colonIndex + 1);
        if (parameter === "default") {
            parameter = "";
        }
    }
    const stateIndex = binarySearch(scope.states, "name", stateName);
    if (stateIndex < 0) {
        return undefined;
    }
    const state = scope.states[stateIndex];
    if (state.parameterizedValues !== undefined) {
        const parameterIndex = binarySearch(state.parameterizedValues, "parameter", parameter);
        if (parameterIndex < 0) {
            return undefined;
        }
        return { value: state.parameterizedValues[parameterIndex].value };
    }
    return { value: state.value };
}

export interface ValueRef {
    value: any;
}