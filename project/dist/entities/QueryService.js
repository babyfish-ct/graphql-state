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
;
const Record_1 = require("./Record");
class QueryService {
    constructor(entityManager, remoteArgsTransformer) {
        this.entityManager = entityManager;
        this.remoteArgsTransformer = remoteArgsTransformer;
    }
    query(args, useCache, useDataService) {
        if (args.ids === undefined) {
            return this.graph(args, useCache, useDataService);
        }
        return this.objects(args, useCache, useDataService);
    }
    graph(args, useCache, useDataService) {
        if (useCache) {
            try {
                return {
                    type: "cached",
                    data: this.findObject(Record_1.QUERY_OBJECT_ID, args.shape)
                };
            }
            catch (ex) {
                if (!ex[" $canNotFoundFromCache"]) {
                    throw ex;
                }
                const reason = ex["reason"];
                if (useDataService) {
                    console.debug(reason);
                }
                else {
                    throw new Error(reason);
                }
            }
        }
        if (useDataService) {
            const promise = this.entityManager.dataService.query(this.tranformRemoteArgs(args.withoutPaginationInfo()));
            return {
                type: "deferred",
                promise: this.reloadResponseFromCache(promise, args)
            };
        }
        throw new Error('Internal bug: neither "useCache" nor "useDataService" is set');
    }
    objects(args, useCache, useDataService) {
        const ids = args.ids;
        if (ids.length === 0) {
            return {
                type: "cached",
                data: []
            };
        }
        let map = new Map();
        if (useCache) {
            map = this.findObjects(ids, args.shape);
        }
        else {
            map = new Map();
        }
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
        if (useDataService) {
            return {
                type: "deferred",
                promise: this.loadAndMerge(map, args, missedIds)
            };
        }
        throw new Error('Internal bug: neither "useCache" nor "useDataService" is set');
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
            }
        }
        return map;
    }
    findObject(id, shape) {
        const ref = this.entityManager.findRefById(shape.typeName, id);
        if (ref === undefined) {
            canNotFoundFromCache(`Cannot find the '${shape.typeName}' object whose id is '${id}'`);
        }
        if (ref.value === undefined) {
            return undefined;
        }
        return mapRecord(this.entityManager.schema.typeMap.get(shape.typeName), ref.value, shape);
    }
    loadAndMerge(objMap, args, missedIds) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const shape = args.shape;
            const idFieldName = this.entityManager.schema.typeMap.get(shape.typeName).idField.name;
            const idFieldAlias = (_b = (_a = shape.fieldMap.get(idFieldName)) === null || _a === void 0 ? void 0 : _a.alias) !== null && _b !== void 0 ? _b : idFieldName;
            const missedObjects = yield this.entityManager.dataService.query(this.tranformRemoteArgs(args.newArgs(missedIds).withoutPaginationInfo()));
            for (const missedObject of missedObjects) {
                objMap.set(missedObject[idFieldAlias], missedObject);
            }
            return args.ids.map(id => objMap.get(id));
        });
    }
    tranformRemoteArgs(args) {
        if (this.remoteArgsTransformer === undefined) {
            return args;
        }
        return this.remoteArgsTransformer(args);
    }
    reloadResponseFromCache(promise, args) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = args.pagination) === null || _a === void 0 ? void 0 : _a.loadMode) !== "initial") {
                yield promise;
                const result = this.query(args, true, false);
                if (result.type !== "cached") {
                    throw new Error("Internal bug: reloadResponseFromCache cannot reload data from cache");
                }
                return result.data;
            }
            return yield promise;
        });
    }
}
exports.QueryService = QueryService;
function mapRecord(type, record, shape) {
    var _a, _b, _c, _d, _e;
    if (record === undefined) {
        return undefined;
    }
    let entity;
    if (type.name === "Query") {
        entity = { [type.idField.name]: Record_1.QUERY_OBJECT_ID };
    }
    else {
        const idShapeField = shape.fieldMap.get(type.idField.name);
        if (idShapeField === undefined) {
            throw new Error(`Cannot map the record whose type is ${type.name} because its id is included in the shape`);
        }
        entity = { [(_a = idShapeField.alias) !== null && _a !== void 0 ? _a : idShapeField.name]: record.id };
    }
    for (const [, shapeField] of shape.fieldMap) {
        if (shapeField.childShape !== undefined) {
            const fieldMetadata = type.fieldMap.get(shapeField.name);
            if (fieldMetadata === undefined) {
                throw new Error(`Cannot map the record whose type is ${type.name} because the shape field "${shapeField.name}" is not a concurrent field`);
            }
            const association = record.getAssociation(fieldMetadata, shapeField.args);
            if (association === undefined && !record.hasAssociation(fieldMetadata, shapeField.args)) {
                canNotFoundFromCache(`Cannot find the associaton field '${fieldMetadata.fullName}${(_c = `:${(_b = shapeField.args) === null || _b === void 0 ? void 0 : _b.key}`) !== null && _c !== void 0 ? _c : ""}' for object whose id is '${record.id}'`);
            }
            entity[(_d = shapeField.alias) !== null && _d !== void 0 ? _d : shapeField.name] = mapAssociation(fieldMetadata, association, fieldMetadata.category === "CONNECTION" ? shapeField.nodeShape : shapeField.childShape);
        }
        else if (shapeField.name !== type.idField.name) {
            const scalar = record.getSalar(shapeField.name);
            if (scalar === undefined && !record.hasScalar(shapeField.name)) {
                canNotFoundFromCache(`Cannot find the scalar field '${shapeField.name}' for object whose id is '${record.id}'`);
            }
            entity[(_e = shapeField.alias) !== null && _e !== void 0 ? _e : shapeField.name] = scalar;
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
function canNotFoundFromCache(reason) {
    throw { " $canNotFoundFromCache": true, reason };
}
