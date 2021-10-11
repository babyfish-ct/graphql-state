import { EntityManager } from "./EntityManager";
import { RuntimeShape } from "./RuntimeShape";
export declare class BatchEntityRequest {
    private entityManager;
    constructor(entityManager: EntityManager);
    private batchByShapeMap;
    private timeout;
    requestObjectByShape(ids: ReadonlyArray<any>, shape: RuntimeShape): Promise<ReadonlyArray<any>>;
    private onTimeout;
    private batchLoadByShape;
}
