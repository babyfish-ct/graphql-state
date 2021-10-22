"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toRuntimeShape0 = exports.toRuntimeShape = void 0;
const graphql_ts_client_api_1 = require("graphql-ts-client-api");
const VariableArgs_1 = require("./VariableArgs");
function toRuntimeShape(fetcher, variables) {
    return toRuntimeShape0("", fetcher, variables);
}
exports.toRuntimeShape = toRuntimeShape;
function toRuntimeShape0(parentPath, fetcher, variables) {
    const fieldNames = Array.from(fetcher.fieldMap.keys());
    fieldNames.sort();
    const runtimeShapeFieldMap = new Map();
    for (const fieldName of fieldNames) {
        addField(parentPath, fieldName, fetcher.fieldMap.get(fieldName), runtimeShapeFieldMap, variables);
    }
    return new RuntimeShapeImpl(fetcher.fetchableType.name, runtimeShapeFieldMap);
}
exports.toRuntimeShape0 = toRuntimeShape0;
function addField(parentPath, fieldName, field, runtimeShapeFieldMap, fetcherVaribles) {
    var _a, _b, _c, _d, _e, _f;
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
    const variables = resolveParameterRefs(field.args, fetcherVaribles);
    if (field.argGraphQLTypes !== undefined) {
        for (const [name, type] of field.argGraphQLTypes) {
            if (type.endsWith("!") && (variables === undefined || variables[name] === undefined)) {
                throw new Error(`Illegal fetch path ${parentPath}${fieldName}, its required arguments ${name} is not specified`);
            }
        }
    }
    const alias = (_a = field.fieldOptionsValue) === null || _a === void 0 ? void 0 : _a.alias;
    const directives = standardizedDirectives(field, fetcherVaribles);
    const childFetcher = field.childFetchers !== undefined ? field.childFetchers[0] : undefined;
    const childShape = childFetcher !== undefined ?
        toRuntimeShape0(`${parentPath}${fieldName}/`, childFetcher, fetcherVaribles) :
        undefined;
    let nodeShape = undefined;
    if ((childFetcher === null || childFetcher === void 0 ? void 0 : childFetcher.fetchableType.category) === "CONNECTION") {
        nodeShape = (_f = (_e = (_d = (_c = (_b = childShape === null || childShape === void 0 ? void 0 : childShape.fieldMap) === null || _b === void 0 ? void 0 : _b.get("edges")) === null || _c === void 0 ? void 0 : _c.childShape) === null || _d === void 0 ? void 0 : _d.fieldMap) === null || _e === void 0 ? void 0 : _e.get("node")) === null || _f === void 0 ? void 0 : _f.childShape;
        if (nodeShape === undefined) {
            throw new Error(`Illega fetch path ${parentPath}${fieldName}, the sub path "edges/node" of connecton is required`);
        }
    }
    runtimeShapeFieldMap.set(fieldName, {
        name: fieldName,
        args: VariableArgs_1.VariableArgs.of(variables),
        alias,
        directives,
        childShape,
        nodeShape
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
    if (variables !== undefined && variables !== null) {
        for (const name in variables) {
            let value = variables[name];
            if (value instanceof graphql_ts_client_api_1.ParameterRef) {
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
class RuntimeShapeImpl {
    constructor(typeName, fieldMap) {
        this.typeName = typeName;
        this.fieldMap = fieldMap;
    }
    toString() {
        let value = this._toString;
        const fields = Array.from(this.fieldMap.values());
        if (value === undefined) {
            this._toString = value = `(${this.typeName},[${fields.map(fieldString)}])`;
        }
        return value;
    }
}
function fieldString(field) {
    var _a, _b;
    return `(${field.name},${(_b = (_a = field.args) === null || _a === void 0 ? void 0 : _a.key) !== null && _b !== void 0 ? _b : ""},${field.alias !== undefined ?
        field.alias :
        ""},${field.directives !== undefined ?
        JSON.stringify(field.directives) :
        ""},${field.childShape !== undefined ?
        field.childShape.toString() :
        ""})`;
}
