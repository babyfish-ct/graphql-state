import { FieldNumberOutlined } from "@ant-design/icons";
import { Draft } from "immer";
import { GraphField, GraphObject, GraphSnapshot, GraphStateMessage, GraphType, GraphTypeMetadata, SimpleState, SimpleStateScope } from "./Model";

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

export function changeGraphSnapshot(
    draft: Draft<GraphSnapshot>,
    message: GraphStateMessage
) {
    const typeMetadata = draft.typeMetadataMap[message.typeName];
    if (typeMetadata === undefined) {
        throw new Error(`Illegal type '${message.typeName}' of graph state message`);
    }
    if (message.changeType === "evict-row" || message.changeType === "evict-fields" || message.changeType === "delete") {
        if (message.typeName === 'Query') {
            if (draft.query !== undefined && message.changeType === 'evict-fields') {
                for (const field of message.fields) {
                    clearFields(typeMetadata, draft.query, field.fieldKey);
                }
            }
        } else {
            const typeIndex = binarySearch(draft.types, "name", message.typeName);
            if (typeIndex >= 0) {
                const type = draft.types[typeIndex];
                const objIndex = binarySearch(type.objects, "id", message.id);
                if (objIndex >= 0) {
                    if (message.changeType === "evict-fields") {
                        for (const field of message.fields) {
                            clearFields(typeMetadata, type.objects[objIndex], field.fieldKey);
                        }
                    } else {
                        type.objects.splice(objIndex, 1);
                    }
                }
            }
        }
    } else {
        if (message.typeName === 'Query') {
            if (draft.query === undefined) {
                draft.query = { id: "____QUERY_OBJECT____", fields: [] };
            }
            for (const field of message.fields) {
                setField(typeMetadata, draft.query!, field.fieldKey, field.newValue);
            }
        } else {
            const typeIndex = binarySearch(draft.types, "name", message.typeName);
            let type: Draft<GraphType>;
            if (typeIndex < 0) {
                type = { name: message.typeName, objects: [] };
                draft.types.splice(-typeIndex - 1, 0, type);
            } else {
                type = draft.types[typeIndex];
            }
            const objIndex = binarySearch(type.objects, "id", message.id);
            let obj: Draft<GraphObject>;
            if (objIndex < 0) {
                obj = { id: message.id, fields: [] };
                type.objects.splice(-objIndex - 1, 0, obj);
            } else {
                obj = type.objects[objIndex];
            }
            for (const field of message.fields) {
                setField(typeMetadata, obj, field.fieldKey, field.newValue);
            }
        }
    }
}

function clearFields(
    typeMetadata: GraphTypeMetadata,
    obj: Draft<GraphObject>,
    fieldKey: string
) {
    const colonIndex = fieldKey.indexOf(':');
    let fieldName: string;
    let parameter: string;
    if (colonIndex === -1) {
        fieldName = fieldKey;
        parameter = "";
    } else {
        fieldName = fieldKey.substring(0, colonIndex);
        parameter = fieldKey.substring(colonIndex + 1);
    }
    const fieldIndex = binarySearch(obj.fields, "name", fieldName);
    if (fieldIndex >= 0) {
        const field = obj.fields[fieldIndex];
        if (typeMetadata.fieldMap[fieldName]?.isParamerized === true) {
            if (field.parameterizedValues !== undefined) {
                const paramIndex = binarySearch(field.parameterizedValues, "parameter", parameter);
                if (paramIndex >= 0) {
                    field.parameterizedValues.splice(paramIndex, 1);
                    if (field.parameterizedValues.length === 0) {
                        obj.fields.splice(fieldIndex, 1);
                    }
                }
            }
        } else {
            obj.fields.splice(fieldIndex, 1);
        }
    } 
}

function setField(
    typeMetadata: GraphTypeMetadata,
    obj: Draft<GraphObject>, 
    fieldKey: string, 
    value: any
) {
    const colonIndex = fieldKey.indexOf(':');
    let fieldName: string;
    let parameter: string;
    if (colonIndex === -1) {
        fieldName = fieldKey;
        parameter = "";
    } else {
        fieldName = fieldKey.substring(0, colonIndex);
        parameter = fieldKey.substring(colonIndex + 1);
    }
    const fieldIndex = binarySearch(obj.fields, "name", fieldName);
    let field: Draft<GraphField>;
    if (fieldIndex < 0) {
        field = { name: fieldName };
        obj.fields.splice(-fieldIndex - 1, 0, field);
    } else {
        field = obj.fields[fieldIndex];
    }
    if (typeMetadata.fieldMap[fieldName]?.isParamerized === true) {
        if (field.parameterizedValues === undefined) {
            field.parameterizedValues = [];
        }
        const parameterIndex = binarySearch(field.parameterizedValues, "parameter", parameter);
        if (parameterIndex < 0) {
            field.parameterizedValues.splice(-parameterIndex - 1, 0, {parameter, value});
        } else {
            field.parameterizedValues[parameterIndex] = {parameter, value};
        }
    } else {
        field.value = value;
    }
}
