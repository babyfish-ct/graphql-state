"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryService = void 0;
const ModificationContext_1 = require("./ModificationContext");
class QueryService {
    constructor(entityMangager) {
        this.entityMangager = entityMangager;
    }
    query(shape) {
        throw new Error("Unsupported");
    }
    queryObject(id, shape) {
        if (shape.typeName === "Query") {
            throw new Error(`The type "${shape.typeName}" does not support 'queryObject'`);
        }
        try {
            return Promise.resolve(this.findObject(id, shape));
        }
        catch (ex) {
            if (!ex[" $canNotFoundFromCache"]) {
                throw ex;
            }
        }
        return this.entityMangager.batchEntityRequest.requestByShape(id, shape).then(obj => {
            const ctx = new ModificationContext_1.ModificationContext();
            this.entityMangager.save(ctx, shape, obj);
            ctx.fireEvents(e => {
                this.entityMangager.stateManager.publishEntityChangeEvent(e);
            });
            return obj;
        });
    }
    findObject(id, shape) {
        const ref = this.entityMangager.findRefById(shape.typeName, id);
        if (ref === undefined) {
            canNotFoundFromCache();
        }
        if (ref.value === undefined) {
            return undefined;
        }
        return mapRecord(this.entityMangager.schema.typeMap.get(shape.typeName), ref.value, shape);
    }
}
exports.QueryService = QueryService;
function mapRecord(type, record, runtimeSchape) {
    var _a, _b;
    const idFieldName = type.idField.name;
    const entity = { [idFieldName]: record === null || record === void 0 ? void 0 : record.id };
    for (const field of runtimeSchape.fields) {
        if (field.childShape !== undefined) {
            const fieldMetadata = type.fieldMap.get(field.name);
            const association = record.getAssociation(fieldMetadata, field.variables);
            if (association === undefined && !record.hasAssociation(fieldMetadata, field.variables)) {
                canNotFoundFromCache();
            }
            entity[(_a = field.alias) !== null && _a !== void 0 ? _a : field.name] = mapAssociation(fieldMetadata, association, field.childShape);
        }
        else if (field.name !== idFieldName) {
            const scalar = record.getSalar(field.name);
            if (scalar === undefined && !record.hasScalar(field.name)) {
                canNotFoundFromCache();
            }
            entity[(_b = field.alias) !== null && _b !== void 0 ? _b : field.name] = scalar;
        }
    }
    return entity;
}
function mapAssociation(field, association, shape) {
    if (association === undefined) {
        return undefined;
    }
    const targetType = field.targetType;
    if (field.category === "CONNECTION") {
        const connection = association;
        return Object.assign(Object.assign({}, connection), { edges: connection.edges.map(edge => {
                return Object.assign(Object.assign({}, edge), { node: mapRecord(targetType, edge.node, shape) });
            }) });
    }
    if (field.category === "LIST") {
        const list = association;
        return list.map(element => {
            if (element === undefined) {
                return undefined;
            }
            return mapRecord(targetType, element, shape);
        });
    }
    return mapRecord(targetType, association, shape);
}
function canNotFoundFromCache() {
    throw { " $canNotFoundFromCache": true };
}
