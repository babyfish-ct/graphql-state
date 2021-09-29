import { EntityManager } from "./EntityManager";
import { RuntimeShape } from "./RuntimeShape";

export class BatchEntityRequest {

    constructor(private entityManager: EntityManager) {}

    private batchByShapeMap = new Map<string, BatchByShape>();

    private timeout: NodeJS.Timeout | undefined = undefined;

    requestByShape(id: any, shape: RuntimeShape): Promise<any> {
        const key = JSON.stringify(shape);
        let batchByShape = this.batchByShapeMap.get(key);
        if (batchByShape === undefined) {
            batchByShape = { shape, resolvers: new Map<any, PromiseRsolver>() };
            this.batchByShapeMap.set(key, batchByShape);
        } 
        if (this.timeout === undefined) {
            this.timeout = setTimeout(() => {
                this.timeout = undefined;
                this.onTimeout();
            }, 0);
        }
        return new Promise((resolve, reject) => {
            batchByShape!.resolvers.set(id, { resolve, reject });
        });
    }

    private onTimeout() {

        const map = this.batchByShapeMap;

        if (map.size !== 0) {
            this.batchByShapeMap = new Map<string, BatchByShape>();
            for (const [, batchByShape] of map) {
                this.batchLoadByShape(batchByShape);
            }
        }
    }

    private batchLoadByShape(batchByShape: BatchByShape) {

        const rawIdFieldName = this.entityManager.schema.typeMap.get(batchByShape.shape.typeName)!.idField.name;
        const idFieldName = batchByShape.shape.fields.find(field => field.name === rawIdFieldName)!.alias ?? rawIdFieldName;
        
        const ids = Array.from(batchByShape.resolvers.keys());

        this
        .entityManager
        .loadByIds(ids, batchByShape.shape)
        .then(arr => {
            const objMap = new Map<any, any>();
            for (const obj of arr) {
                const id = obj[idFieldName];
                if (id === undefined || id === null) {
                    throw new Error(`Batch Loader cannot return array contains objects without id`);
                }
                objMap.set(id, obj);
            }
            for (const [id, {resolve}] of batchByShape.resolvers) {
                resolve(objMap.get(id));
            }
        })
        .catch(error => {
            for (const [{reject}] of batchByShape.resolvers) {
                reject(error);
            }
        })
    }
}

interface BatchByShape {
    readonly shape: RuntimeShape,
    readonly resolvers: Map<any, PromiseRsolver>;
}

interface PromiseRsolver {
    resolve: (data: any) => void;
    reject: (error: any) => void;
}
