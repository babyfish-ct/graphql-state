"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryContext = void 0;
const RuntimeShape_1 = require("./RuntimeShape");
class QueryContext {
    constructor(entityMangager) {
        this.entityMangager = entityMangager;
    }
    queryObjectByShape(typeName, id, shape, options) {
        const type = this.entityMangager.schema.typeMap.get(typeName);
        if (type === undefined) {
            throw Error(`Illegal type name ${typeName}`);
        }
        const runtimeShape = RuntimeShape_1.toRuntimeShape(type, shape);
        try {
            return Promise.resolve(this.findObjectByShape(id, runtimeShape));
        }
        catch (ex) {
            if (!ex[" $canNotFoundFromCache"]) {
                throw ex;
            }
        }
        return this.entityMangager.batchEntityRequest.requestByShape(id, runtimeShape);
    }
    queryObjectByFetcher(id, fetcher, options) {
        throw new Error();
    }
    queryByFetcher(fetcher, options) {
        throw new Error();
    }
    findObjectByShape(id, shape) {
        const ref = this.entityMangager.findById(shape.typeName, id);
        if (ref === undefined) {
            canNotFoundFromCache();
        }
        if (ref.value === undefined) {
            return undefined;
        }
        return mapRecordByShape(this.entityMangager.schema.typeMap.get(shape.typeName), ref.value, shape);
    }
}
exports.QueryContext = QueryContext;
function mapRecordByShape(type, record, runtimeSchape) {
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
            entity[(_a = field.alias) !== null && _a !== void 0 ? _a : field.name] = mapAssociationByShape(fieldMetadata, association, field.childShape);
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
function mapAssociationByShape(field, association, shape) {
    if (association === undefined) {
        return undefined;
    }
    const targetType = field.targetType;
    if (field.category === "CONNECTION") {
        const connection = association;
        return Object.assign(Object.assign({}, connection), { edges: connection.edges.map(edge => {
                return Object.assign(Object.assign({}, edge), { node: mapRecordByShape(targetType, edge.node, shape) });
            }) });
    }
    if (field.category === "LIST") {
        const list = association;
        return list.map(element => {
            if (element === undefined) {
                return undefined;
            }
            return mapRecordByShape(targetType, element, shape);
        });
    }
    return mapRecordByShape(targetType, association, shape);
}
function canNotFoundFromCache() {
    throw { " $canNotFoundFromCache": true };
}
