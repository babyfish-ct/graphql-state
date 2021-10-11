import { EntityManager } from "./EntityManager";
import { RuntimeShape } from "./RuntimeShape";

export class BatchEntityRequest {

    constructor(private entityManager: EntityManager) {}

    private batchByShapeMap = new Map<any, BatchByShape>();

    private timeout: NodeJS.Timeout | undefined = undefined;

    requestObjectByShape(ids: ReadonlyArray<any>, shape: RuntimeShape): Promise<ReadonlyArray<any>> {
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
        const resolverKey = JSON.stringify(ids);
        return new Promise((resolve, reject) => {
            const oldResolver = batchByShape?.resolvers.get(resolverKey);
            if (oldResolver === undefined) {
                batchByShape!.resolvers.set(JSON.stringify(ids), { resolve, reject });
            } else {
                batchByShape!.resolvers.set(JSON.stringify(ids), mergeResolver(oldResolver, { resolve, reject }));
            }
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
        
        const ids = Array.from(
            new Set<any>(
                Array
                .from(batchByShape.resolvers.keys())
                .flatMap(key => JSON.parse(key) as ReadonlyArray<any>)
            )
        );

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
            for (const [key, {resolve}] of batchByShape.resolvers) {
                for (const id of JSON.parse(key) as ReadonlyArray<any>) {
                    resolve(objMap.get(id));
                }
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

function mergeResolver(a: PromiseRsolver, b: PromiseRsolver): PromiseRsolver {
    return {
        resolve: data => {
            a.resolve(data);
            b.resolve(data);
        },
        reject: error => {
            a.reject(error);
            b.reject(error);
        }
    }
}