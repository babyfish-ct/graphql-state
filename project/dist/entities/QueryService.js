"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    queryObjects(ids, shape) {
        return __awaiter(this, void 0, void 0, function* () {
            if (shape.typeName === "Query") {
                throw new Error(`The type "${shape.typeName}" does not support 'queryObject'`);
            }
            if (ids.length === 0) {
                return [];
            }
            const map = this.findObjects(ids, shape);
            const missedIds = [];
            for (const [id, obj] of map) {
                if (obj === undefined) {
                    missedIds.push(id);
                }
            }
            if (missedIds.length === 0) {
                return Array.from(map.values());
            }
            const missedObjects = yield this.entityMangager.batchEntityRequest.requestObjectByShape(missedIds, shape).then(arr => {
                const ctx = new ModificationContext_1.ModificationContext();
                for (const obj of arr) {
                    this.entityMangager.save(ctx, shape, obj);
                    ctx.fireEvents(e => {
                        this.entityMangager.stateManager.publishEntityChangeEvent(e);
                    });
                }
                return arr;
            });
            const idFieldName = this.entityMangager.schema.typeMap.get(shape.typeName).idField.name;
            for (const missedObject of missedObjects) {
                map.set(missedObject[idFieldName], missedObject);
            }
            return Array.from(map.values());
        });
    }
    findObjects(ids, shape) {
        const map = new Map();
        for (const id of ids) {
            try {
                map.set(id, this.findObject(id, shape));
            }
            catch (ex) {
                if (!ex[" $canNotFoundFromCache"]) {
                    throw ex;
                }
                map.set(id, undefined);
            }
        }
        return map;
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