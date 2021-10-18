"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryArgs = void 0;
const Variables_1 = require("../state/impl/Variables");
const RuntimeShape_1 = require("./RuntimeShape");
class QueryArgs {
    constructor(shape, fetcher, ids, variables) {
        this.shape = shape;
        this.fetcher = fetcher;
        this.ids = ids;
        this.variables = variables;
        if (variables === undefined) {
            this._key = shape.toString();
        }
        else {
            this._key = `${shape.toString()}:${JSON.stringify(variables)}`;
        }
    }
    get key() {
        return this._key;
    }
    static create(fetcher, ids, variables) {
        if (fetcher.fetchableType.name === 'Query' && ids !== undefined) {
            throw new Error("Generic query does not support id");
        }
        else if (fetcher.fetchableType.name !== 'Query' && ids === undefined) {
            throw new Error("Id is required for object query");
        }
        const vs = Variables_1.standardizedVariables(variables);
        return new QueryArgs(RuntimeShape_1.toRuntimeShape(fetcher, variables), fetcher, ids, vs);
    }
    newArgs(ids) {
        if (this.ids === undefined) {
            throw new Error(`The function 'missed' is not supported because the current query args is used for object query`);
        }
        return new QueryArgs(this.shape, this.fetcher, ids, this.variables);
    }
    contains(args) {
        if (this === args) {
            return true;
        }
        return containsIds(this.ids, args.ids) && containsShape(this.shape, args.shape);
    }
}
exports.QueryArgs = QueryArgs;
function containsIds(a, b) {
    if (a === undefined || b === undefined) {
        if (a !== b) {
            throw new Error("Internal bug: containsShape accept defined ids and undefined ids");
        }
        return true;
    }
    if (a.length < b.length) {
        return false;
    }
    for (const id of b) {
        if (a.findIndex(e => e === id) === -1) {
            return false;
        }
    }
    return true;
}
function containsShape(a, b) {
    var _a, _b;
    if (a === undefined || b === undefined) {
        if (a !== b) {
            throw new Error("Internal bug: containsShape accept defined shape and undefined shape");
        }
        return true;
    }
    if (a.typeName !== b.typeName) {
        return false;
    }
    for (const [fieldName, field] of b.fieldMap) {
        const fieldA = a.fieldMap.get(fieldName);
        if (fieldA === undefined) {
            return false;
        }
        if (((_a = fieldA === null || fieldA === void 0 ? void 0 : fieldA.args) === null || _a === void 0 ? void 0 : _a.key) !== ((_b = field === null || field === void 0 ? void 0 : field.args) === null || _b === void 0 ? void 0 : _b.key)) {
            return false;
        }
        if (!containsShape(fieldA.childShape, field.childShape)) {
            return false;
        }
    }
    return true;
}
