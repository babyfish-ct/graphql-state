"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchEntityRequest = void 0;
class BatchEntityRequest {
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.batchByShapeMap = new Map();
        this.timeout = undefined;
    }
    requestObjectByShape(ids, shape) {
        const key = JSON.stringify(shape);
        let batchByShape = this.batchByShapeMap.get(key);
        if (batchByShape === undefined) {
            batchByShape = { shape, resolvers: new Map() };
            this.batchByShapeMap.set(key, batchByShape);
        }
        if (this.timeout === undefined) {
            this.timeout = setTimeout(() => {
                this.timeout = undefined;
                this.onTimeout();
            }, 0);
        }
        const resolverKey = JSON.stringify(ids);
        return new Promise((resolve, reject) => {
            const oldResolver = batchByShape === null || batchByShape === void 0 ? void 0 : batchByShape.resolvers.get(resolverKey);
            if (oldResolver === undefined) {
                batchByShape.resolvers.set(JSON.stringify(ids), { resolve, reject });
            }
            else {
                batchByShape.resolvers.set(JSON.stringify(ids), mergeResolver(oldResolver, { resolve, reject }));
            }
        });
    }
    onTimeout() {
        const map = this.batchByShapeMap;
        if (map.size !== 0) {
            this.batchByShapeMap = new Map();
            for (const [, batchByShape] of map) {
                this.batchLoadByShape(batchByShape);
            }
        }
    }
    batchLoadByShape(batchByShape) {
        var _a;
        const rawIdFieldName = this.entityManager.schema.typeMap.get(batchByShape.shape.typeName).idField.name;
        const idFieldName = (_a = batchByShape.shape.fields.find(field => field.name === rawIdFieldName).alias) !== null && _a !== void 0 ? _a : rawIdFieldName;
        const ids = Array.from(new Set(Array
            .from(batchByShape.resolvers.keys())
            .flatMap(key => JSON.parse(key))));
        this
            .entityManager
            .loadByIds(ids, batchByShape.shape)
            .then(arr => {
            const objMap = new Map();
            for (const obj of arr) {
                const id = obj[idFieldName];
                if (id === undefined || id === null) {
                    throw new Error(`Batch Loader cannot return array contains objects without id`);
                }
                objMap.set(id, obj);
            }
            for (const [key, { resolve }] of batchByShape.resolvers) {
                for (const id of JSON.parse(key)) {
                    resolve(objMap.get(id));
                }
            }
        })
            .catch(error => {
            for (const [{ reject }] of batchByShape.resolvers) {
                reject(error);
            }
        });
    }
}
exports.BatchEntityRequest = BatchEntityRequest;
function mergeResolver(a, b) {
    return {
        resolve: data => {
            a.resolve(data);
            b.resolve(data);
        },
        reject: error => {
            a.reject(error);
            b.reject(error);
        }
    };
}
