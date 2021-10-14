"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractDataService = void 0;
class AbstractDataService {
    constructor(entityManager) {
        this.entityManager = entityManager;
    }
    toObjectMap(data, args) {
        var _a, _b;
        const ids = args.ids;
        if (ids === undefined) {
            throw new Error(`'toObjectMap' is not supported for the query args that is not used to load objects`);
        }
        const shape = args.shape;
        const objs = Array.isArray(data) ? data : data["entities"];
        if (!Array.isArray(objs)) {
            throw new Error("For objects loading, the remote loader must return an array or an object with an array field named 'entities'");
        }
        const idFieldName = this.entityManager.schema.typeMap.get(shape.typeName).idField.name;
        const idFieldAlias = (_b = (_a = shape.fieldMap.get(idFieldName)) === null || _a === void 0 ? void 0 : _a.alias) !== null && _b !== void 0 ? _b : idFieldName;
        const objMap = new Map();
        for (const obj of objs) {
            objMap.set(obj[idFieldAlias], obj);
        }
        return objMap;
    }
    standardizedResult(data, args, reshapeObject = false) {
        if (data === undefined) {
            return undefined;
        }
        if (args.ids !== undefined) {
            const objMap = this.toObjectMap(data, args);
            return args.ids.map(id => {
                const obj = objMap.get(id);
                return reshapeObject ? this.reshapeObject(obj, args.shape) : obj;
            });
        }
        return reshapeObject ? this.reshapeObject(data, args.shape) : data;
    }
    reshapeObject(obj, shape) {
        var _a, _b;
        if (obj === undefined) {
            return undefined;
        }
        if (Array.isArray(obj)) {
            return obj.map(element => this.reshapeObject(element, shape));
        }
        const type = this.entityManager.schema.typeMap.get(shape.typeName);
        const result = {};
        for (const [, field] of shape.fieldMap) {
            const name = (_a = field.alias) !== null && _a !== void 0 ? _a : field.name;
            const value = obj[name];
            if (((_b = type.fieldMap.get(name)) === null || _b === void 0 ? void 0 : _b.category) === 'CONNECTION') {
                result[name] = this.reshapeConnnection(value, field.childShape);
            }
            else if (field.childShape !== undefined) {
                result[name] = this.reshapeObject(value, field.childShape);
            }
            else {
                result[name] = value;
            }
        }
        return result;
    }
    reshapeConnnection(connection, nodeShape) {
        const edges = connection
            .edges
            .map(edge => {
            return Object.assign(Object.assign({}, edge), { node: this.reshapeObject(edge.node, nodeShape) });
        });
        return Object.assign(Object.assign({}, connection), { edges });
    }
    onLoaded(args, data) { }
}
exports.AbstractDataService = AbstractDataService;
