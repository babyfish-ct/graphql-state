"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toRuntimeShape = void 0;
const graphql_ts_client_api_1 = require("graphql-ts-client-api");
const Variables_1 = require("../state/impl/Variables");
function toRuntimeShape(fetcher, variables) {
    const runtimeShapeFieldMap = new Map();
    for (const [fieldName, field] of fetcher.fieldMap) {
        addField(fieldName, field, runtimeShapeFieldMap, variables);
    }
    const fields = [];
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
exports.toRuntimeShape = toRuntimeShape;
function addField(fieldName, field, runtimeShapeFieldMap, fetcherVaribles) {
    var _a;
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
    const variables = Variables_1.standardizedVariables(resolveParameterRefs(field.args, fetcherVaribles));
    const alias = (_a = field.fieldOptionsValue) === null || _a === void 0 ? void 0 : _a.alias;
    const directives = standardizedDirectives(field, fetcherVaribles);
    const childShape = field.childFetchers !== undefined ?
        toRuntimeShape(field.childFetchers[0], fetcherVaribles) :
        undefined;
    const key = variables !== undefined || alias !== undefined || directives !== undefined ?
        `${fieldName}(${variables !== undefined ? JSON.stringify(variables) : ""}|${alias !== undefined ? alias : ""}|${directives !== undefined ? JSON.stringify(directives) : ""})` :
        fieldName;
    runtimeShapeFieldMap.set(key, {
        name: fieldName,
        variables,
        alias,
        directives,
        childShape
    });
}
function standardizedDirectives(field, fetcherVaribles) {
    const map = {};
    const names = [];
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
function resolveParameterRefs(variables, fetcherVariables) {
    if (variables === undefined || variables === null) {
        return undefined;
    }
    const names = [];
    const resolved = {};
    for (const name of variables) {
        let value = variables[name];
        if (value instanceof graphql_ts_client_api_1.ParameterRef) {
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
