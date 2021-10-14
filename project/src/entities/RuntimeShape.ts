import { Fetcher, FetcherField, ParameterRef } from "graphql-ts-client-api";
import { standardizedVariables } from "../state/impl/Variables";

/*
 * RuntimeShape = Fetcher + Variables
 */
export interface RuntimeShape {
    readonly typeName: string;
    readonly fields: RuntimeShapeField[];
    toString(): string;
}

export interface RuntimeShapeField {
    readonly name: string;
    readonly variables?: any;
    readonly alias?: string;
    readonly directives?: any;
    readonly childShape?: RuntimeShape
}

export function toRuntimeShape<TVariables extends object>(
    fetcher: Fetcher<string, object, TVariables>, 
    variables?: TVariables
): RuntimeShape {
    return toRuntimeShape0("", fetcher, variables);
}

export function toRuntimeShape0(
    parentPath: string,
    fetcher: Fetcher<string, object, object>, 
    variables?: object
): RuntimeShape {
    const runtimeShapeFieldMap = new Map<string, RuntimeShapeField>();
    for (const [fieldName, field] of fetcher.fieldMap) {
        addField(parentPath, fieldName, field, runtimeShapeFieldMap, variables);
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
    return new RuntimeShapeImpl(
        fetcher.fetchableType.name,
        fields
    );
}

function addField(
    parentPath: string,
    fieldName: string,
    field: FetcherField,
    runtimeShapeFieldMap: Map<string, RuntimeShapeField>,
    fetcherVaribles: any
) {
    if (fieldName.startsWith("...")) {
        if (field.childFetchers !== undefined) {
            for (const childFetcher of field.childFetchers) {
                for (const [subFieldName, subField] of childFetcher.fieldMap) {
                    addField(parentPath, subFieldName, subField, runtimeShapeFieldMap, fetcherVaribles);
                } 
            }
        }
        return;
    }
    const variables = standardizedVariables(resolveParameterRefs(field.args, fetcherVaribles));
    if (field.argGraphQLTypes !== undefined) {
        for (const [name, type] of field.argGraphQLTypes) {
            if (type.endsWith("!") && (variables === undefined || variables[name] === undefined)) {
                throw new Error(`Illegal fetch path ${parentPath}${fieldName}, its required arguments ${name} is not specified`);
            }
        }
    }

    const alias = field.fieldOptionsValue?.alias;
    const directives = standardizedDirectives(field, fetcherVaribles);
    const childShape = 
        field.childFetchers !== undefined ?
        toRuntimeShape0(`${parentPath}${fieldName}/`, field.childFetchers[0], fetcherVaribles) :
        undefined;
    
    runtimeShapeFieldMap.set(
        fieldName,
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
    fetcherVaribles: object | undefined
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
    if (variables !== undefined && variables !== null) {
        for (const name in variables) {
            let value = variables[name];
            if (value instanceof ParameterRef) {
                value = fetcherVariables !== undefined ? fetcherVariables[value.name] : undefined;
            }
            if (value !== undefined && value !== null) {
                names.push(name);
                resolved[name] = value;
            }
        }
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

class RuntimeShapeImpl implements RuntimeShape {

    private _toString?: string;

    constructor(
        readonly typeName: string,
        readonly fields: RuntimeShapeField[]
    ) {}

    toString(): string {
        let value = this._toString;
        if (value === undefined) {
            this._toString = value = `(${this.typeName},[${this.fields.map(fieldString)}])`;
        }
        return value;
    }
}

function fieldString(field: RuntimeShapeField): string {
    return `(${
        field.name
    },${
        field.variables !== undefined ? 
        JSON.stringify(field.variables) :
        ""
    },${
        field.alias !== undefined ?
        field.alias :
        ""
    },${
        field.directives !== undefined ?
        JSON.stringify(field.directives) :
        ""
    },${
        field.childShape !== undefined ?
        field.childShape.toString() :
        ""
    })`;
}