import { Fetcher, FetcherField } from "graphql-ts-client-api";
import { VariableArgs } from "../state/impl/Args";
import { GRAPHQL_STATE_PAGINATION_INFO } from "./PaginationFetcherProcessor";

/*
 * RuntimeShape = Fetcher + Variables
 */
export interface RuntimeShape {
    readonly typeName: string;
    readonly fieldMap: ReadonlyMap<string, RuntimeShapeField>;
    toString(): string;
}

export interface RuntimeShapeField {
    readonly name: string;
    readonly args?: VariableArgs;
    readonly alias?: string;
    readonly directives?: any;
    readonly childShape?: RuntimeShape;
    readonly nodeShape?: RuntimeShape;
}

export function toRuntimeShape<TVariables extends object>(
    fetcher: Fetcher<string, object, TVariables>, 
    paginationConnName?: string,
    variables?: TVariables
): RuntimeShape {
    return toRuntimeShape0("", fetcher, paginationConnName, variables);
}

export function toRuntimeShape0(
    parentPath: string,
    fetcher: Fetcher<string, object, object>, 
    paginationConnName?: string,
    variables?: object
): RuntimeShape {
    
    const fieldNames = Array.from(fetcher.fieldMap.keys());
    fieldNames.sort();

    const runtimeShapeFieldMap = new Map<string, RuntimeShapeField>();

    for (const fieldName of fieldNames) {
        addField(
            parentPath, 
            fieldName, 
            fetcher.fieldMap.get(fieldName)!, 
            runtimeShapeFieldMap, 
            paginationConnName,
            variables
        );
    }
    return new RuntimeShapeImpl(
        fetcher.fetchableType.name,
        runtimeShapeFieldMap
    );
}

function addField(
    parentPath: string,
    fieldName: string,
    field: FetcherField,
    runtimeShapeFieldMap: Map<string, RuntimeShapeField>,
    paginationConnName: string | undefined,
    fetcherVaribles: any
) {
    if (fieldName.startsWith("...")) {
        if (field.childFetchers !== undefined) {
            for (const childFetcher of field.childFetchers) {
                for (const [subFieldName, subField] of childFetcher.fieldMap) {
                    addField(
                        parentPath, 
                        subFieldName, 
                        subField, 
                        runtimeShapeFieldMap, 
                        undefined,
                        fetcherVaribles
                    );
                } 
            }
        }
        return;
    }
    let variables = resolveParameterRefs(field.args, fetcherVaribles, field.argGraphQLTypes);
    if (field.argGraphQLTypes !== undefined) {
        for (const [name, type] of field.argGraphQLTypes) {
            if (type.endsWith("!") && (variables === undefined || variables[name] === undefined)) {
                throw new Error(`Illegal fetch path ${parentPath}${fieldName}, its required arguments ${name} is not specified`);
            }
        }
    }
    if (paginationConnName === fieldName && fetcherVaribles !== undefined) {
        variables = {
            ...variables,
            [GRAPHQL_STATE_PAGINATION_INFO]: fetcherVaribles[GRAPHQL_STATE_PAGINATION_INFO]
        };
    }

    const alias = field.fieldOptionsValue?.alias;
    const directives = standardizedDirectives(field, fetcherVaribles);
    const childFetcher = field.childFetchers !== undefined ? field.childFetchers[0] : undefined;
    const childShape = 
        childFetcher !== undefined ?
        toRuntimeShape0(`${parentPath}${fieldName}/`, childFetcher, undefined, fetcherVaribles) :
        undefined;
    let nodeShape: RuntimeShape | undefined = undefined;
    if (childFetcher?.fetchableType.category === "CONNECTION") {
        nodeShape = childShape?.fieldMap?.get("edges")?.childShape?.fieldMap?.get("node")?.childShape;
        if (nodeShape === undefined) {
            throw new Error(`Illega fetch path ${parentPath}${fieldName}, the sub path "edges/node" of connecton is required`);
        }
    }
    
    runtimeShapeFieldMap.set(
        fieldName,
        {
            name: fieldName,
            args: VariableArgs.of(variables),
            alias,
            directives,
            childShape,
            nodeShape
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
    fetcherVariables: any,
    argGraphQLTypes?: ReadonlyMap<string, string>
): any {
    if (variables === undefined || variables === null) {
        return undefined;
    }
    const names: string[] = [];
    const resolved = {};
    if (variables !== undefined && variables !== null) {
        for (const name in variables) {
            let value = variables[name];
            if (value[" $__instanceOfParameterRef"]) {
                value = fetcherVariables !== undefined ? fetcherVariables[value.name] : undefined;
            }
            if (value !== undefined && value !== null && 
                (value !== "" || argGraphQLTypes?.get(name)?.endsWith("!") !== false)
            ) {
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
        readonly fieldMap: ReadonlyMap<string, RuntimeShapeField>
    ) {}

    toString(): string {
        let value = this._toString;
        const fields = Array.from(this.fieldMap.values());
        if (value === undefined) {
            this._toString = value = `(${this.typeName},[${fields.map(fieldString)}])`;
        }
        return value;
    }
}

function fieldString(field: RuntimeShapeField): string {
    return `(${
        field.name
    },${
        field.args?.key ?? ""
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