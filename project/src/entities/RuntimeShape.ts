import { Fetcher, FetcherField, ParameterRef } from "graphql-ts-client-api";
import { standardizedVariables } from "../state/impl/Variables";

export interface RuntimeShape {
    readonly typeName: string;
    readonly fields: RuntimeShapeField[];
}

export interface RuntimeShapeField {
    readonly name: string;
    readonly variables?: any;
    readonly alias?: string;
    readonly directives?: any;
    readonly childShape?: RuntimeShape
}

export function toRuntimeShape<TVariables extends object>(
    fetcher: Fetcher<string, any, TVariables>, 
    variables?: TVariables
): RuntimeShape {
    const runtimeShapeFieldMap = new Map<string, RuntimeShapeField>();
    for (const [fieldName, field] of fetcher.fieldMap) {
        addField(fieldName, field, runtimeShapeFieldMap, variables);
    }
    const fields: RuntimeShapeField[] = [];
    for (const [, field] of runtimeShapeFieldMap) {
        fields.push(field);
    }
    fields.sort((a, b) => {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return +1;
        }
        return 0;
    });
    return {
        typeName: fetcher.fetchableType.name,
        fields
    };
}

function addField(
    fieldName: string,
    field: FetcherField,
    runtimeShapeFieldMap: Map<string, RuntimeShapeField>,
    fetcherVaribles: any
) {
    if (fieldName.startsWith("...")) {
        if (field.childFetchers !== undefined) {
            for (const childFetcher of field.childFetchers) {
                for (const [subFieldName, subField] of childFetcher.fieldMap) {
                    addField(subFieldName, subField, runtimeShapeFieldMap, fetcherVaribles);
                } 
            }
        }
        return;
    }
    const variables = standardizedVariables(resolveParameterRefs(field.args, fetcherVaribles));
    const alias = field.fieldOptionsValue?.alias;
    const directives = standardizedDirectives(field, fetcherVaribles);
    const childShape = 
        field.childFetchers !== undefined ?
        toRuntimeShape(field.childFetchers[0], fetcherVaribles) :
        undefined;
    
    const key = 
        variables !== undefined || alias !== undefined || directives !== undefined ?
        `${fieldName}(${
            variables !== undefined ? JSON.stringify(variables) : ""
        }|${
            alias !== undefined ? alias : ""
        }|${
            directives !== undefined ? JSON.stringify(directives) : ""
        })` :
        fieldName
    ;
    
    runtimeShapeFieldMap.set(
        key,
        {
            name: fieldName,
            variables,
            alias,
            directives,
            childShape
        }
    );
}

function standardizedDirectives(
    field: FetcherField,
    fetcherVaribles: any
): any {
    const map = {};
    const names: string[] = [];
    if (field.fieldOptionsValue !== undefined) {
        for (const [name, variables] of field.fieldOptionsValue.directives) {
            names.push(name);
            map[name] = resolveParameterRefs(variables, fetcherVaribles);
        }
    }
    if (names.length === 0) {
        return undefined;
    }
    if (names.length === 1) {
        return map;
    }
    names.sort();
    const result = {};
    for (const name of names) {
        result[name] = map[name];
    }
    return result;
}

function resolveParameterRefs(
    variables: any, 
    fetcherVariables: any
): any {
    if (variables === undefined || variables === null) {
        return undefined;
    }
    const names: string[] = [];
    const resolved = {};
    for (const name of variables) {
        let value = variables[name];
        if (value instanceof ParameterRef) {
            value = fetcherVariables[value.name];
        }
        names.push(name);
        resolved[name] = value;
    }
    if (names.length === 0) {
        return undefined;
    }
    if (names.length === 1) {
        return resolved;
    }
    names.sort();
    const result = {};
    for (const name of names) {
        result[name] = resolved[name];
    }
    return result;
}