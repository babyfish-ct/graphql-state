import { EntityManager } from "./EntityManager";
import { RuntimeShape } from "./RuntimeShape";
export declare class BatchEntityRequest {
    private entityManager;
    constructor(entityManager: EntityManager);
    private batchByShapeMap;
    private timeout;
    requestByShape(id: any, shape: RuntimeShape): Promise<any>;
    private onTimeout;
    private batchLoadByShape;
}
