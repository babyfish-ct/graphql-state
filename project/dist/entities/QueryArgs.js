"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryArgs = void 0;
const RuntimeShape_1 = require("./RuntimeShape");
class QueryArgs {
    constructor(shape, fetcher, ids, optionsArgs) {
        this.shape = shape;
        this.fetcher = fetcher;
        this.ids = ids;
        this.optionsArgs = optionsArgs;
        if (optionsArgs === undefined) {
            this._key = shape.toString();
        }
        else {
            this._key = `${shape.toString()}:${optionsArgs.key}`;
        }
    }
    get key() {
        return this._key;
    }
    static create(fetcher, ids, optionArgs) {
        var _a;
        if (fetcher.fetchableType.name === 'Query' && ids !== undefined) {
            throw new Error("Generic query does not support id");
        }
        else if (fetcher.fetchableType.name !== 'Query' && ids === undefined) {
            throw new Error("Id is required for object query");
        }
        return new QueryArgs(RuntimeShape_1.toRuntimeShape(fetcher, (_a = optionArgs === null || optionArgs === void 0 ? void 0 : optionArgs.variableArgs) === null || _a === void 0 ? void 0 : _a.variables), fetcher, ids, optionArgs);
    }
    newArgs(ids) {
        if (this.ids === undefined) {
            throw new Error(`The function 'missed' is not supported because the current query args is used for object query`);
        }
        return new QueryArgs(this.shape, this.fetcher, ids, this.optionsArgs);
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
