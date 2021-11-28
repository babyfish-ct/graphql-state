"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectFilter = exports.reshapeObject = void 0;
function reshapeObject(schema, obj, shape) {
    var _a, _b;
    if (obj === undefined || obj === null) {
        return undefined;
    }
    if (Array.isArray(obj)) {
        return obj.map(element => reshapeObject(schema, element, shape));
    }
    const type = schema.typeMap.get(shape.typeName);
    if (type === undefined) {
        throw new Error(`Illegal object type ${shape}`);
    }
    const result = {};
    for (const [, field] of shape.fieldMap) {
        const name = (_a = field.alias) !== null && _a !== void 0 ? _a : field.name;
        let value = obj[name];
        if (value === null) {
            value = undefined;
        }
        if (((_b = type.fieldMap.get(name)) === null || _b === void 0 ? void 0 : _b.category) === 'CONNECTION') {
            result[name] = reshapeConnnection(schema, value, field.nodeShape);
        }
        else if (field.childShape !== undefined) {
            result[name] = reshapeObject(schema, value, field.childShape);
        }
        else {
            result[name] = value;
        }
    }
    return result;
}
exports.reshapeObject = reshapeObject;
function reshapeConnnection(schema, connection, nodeShape) {
    const edges = connection
        .edges
        .map((edge) => {
        return Object.assign(Object.assign({}, edge), { node: reshapeObject(schema, edge.node, nodeShape) });
    });
    return Object.assign(Object.assign({}, connection), { edges });
}
class ObjectFilter {
    constructor(schema, data, ids, shape) {
        this.schema = schema;
        this.data = data;
        this.ids = ids;
        this.shape = shape;
    }
    get(ids) {
        if (this.ids === undefined || ids === undefined || JSON.stringify(this.ids) === JSON.stringify(ids)) {
            return this.data;
        }
        return ids.map(id => this.objMap.get(id));
    }
    get objMap() {
        let map = this._objMap;
        if (map === undefined) {
            this._objMap = map = this.createObjMap();
        }
        return map;
    }
    createObjMap() {
        var _a;
        const type = this.schema.typeMap.get(this.shape.typeName);
        if (type === undefined) {
            throw new Error(`Illegal object type ${this.shape}`);
        }
        const idShapeField = this.shape.fieldMap.get(type.idField.name);
        if (idShapeField === undefined) {
            throw new Error(`id field ${type.name}.${type.idField.name} is not included by shape`);
        }
        const arr = Array.isArray(this.data) ? this.data : this.data["entities"];
        if (!Array.isArray(arr)) {
            throw new Error("For objects loading, the remote loader must return an array or an object with an array field named 'entities'");
        }
        const objMap = new Map();
        for (const obj of arr) {
            const id = obj[(_a = idShapeField.alias) !== null && _a !== void 0 ? _a : idShapeField.name];
            if (id === undefined || id === null) {
                throw new Error(`Illegal object whose value of id field ${type.name}.${type.idField.name} is not specified`);
            }
            objMap.set(id, obj);
        }
        return objMap;
    }
}
exports.ObjectFilter = ObjectFilter;
