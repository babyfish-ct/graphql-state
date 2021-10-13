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
const Record_1 = require("./Record");
class QueryService {
    constructor(entityMangager) {
        this.entityMangager = entityMangager;
    }
    query(shape) {
        if (shape.typeName !== "Query") {
            throw new Error(`The type of 'shape' arugment of 'query' must be 'Query'`);
        }
        try {
            return {
                type: "cached",
                data: this.findObject(Record_1.QUERY_OBJECT_ID, shape)
            };
        }
        catch (ex) {
            if (!ex[" $canNotFoundFromCache"]) {
                throw ex;
            }
        }
        return {
            type: "deferred",
            promise: this.loadMissedQuery(shape)
        };
    }
    queryObjects(ids, shape) {
        if (shape.typeName === "Query") {
            throw new Error(`The type of 'shape' arugment of 'query' cannot be 'Query'`);
        }
        if (ids.length === 0) {
            return {
                type: "cached",
                data: []
            };
        }
        const map = this.findObjects(ids, shape);
        const missedIds = [];
        for (const id of ids) {
            if (!map.has(id)) {
                missedIds.push(id);
            }
        }
        if (missedIds.length === 0) {
            return {
                type: "cached",
                data: Array.from(map.values())
            };
        }
        return {
            type: "deferred",
            promise: this.loadMissedObjects(map, missedIds, shape)
        };
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
    loadMissedObjects(cachedMap, missedIds, shape) {
        return __awaiter(this, void 0, void 0, function* () {
            const missedObjects = yield this.entityMangager._batchEntityRequest.requestObjectByShape(missedIds, shape);
            const idFieldName = this.entityMangager.schema.typeMap.get(shape.typeName).idField.name;
            for (const missedObject of missedObjects) {
                cachedMap.set(missedObject[idFieldName], missedObject);
            }
            this.entityMangager.modify(() => {
                for (const missedId of missedIds) {
                    const obj = cachedMap.get(missedId);
                    if (obj !== undefined) {
                        this.entityMangager.save(shape, obj);
                    }
                    else {
                        this.entityMangager.delete(shape.typeName, missedId);
                    }
                }
            });
            return Array.from(cachedMap.values());
            ;
        });
    }
    loadMissedQuery(shape) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error(`Unsupported operation`);
        });
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
