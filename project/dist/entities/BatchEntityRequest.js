"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchEntityRequest = void 0;
class BatchEntityRequest {
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.batchByShapeMap = new Map();
        this.timeout = undefined;
    }
    requestByShape(id, shape) {
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
        return new Promise((resolve, reject) => {
            batchByShape.resolvers.set(id, { resolve, reject });
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
        const ids = Array.from(batchByShape.resolvers.keys());
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
            for (const [id, { resolve }] of batchByShape.resolvers) {
                resolve(objMap.get(id));
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
