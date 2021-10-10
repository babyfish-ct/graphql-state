import { EntityManager } from "./EntityManager";
import { RuntimeShape } from "./RuntimeShape";
export declare class QueryService {
    private entityMangager;
    constructor(entityMangager: EntityManager);
    query(shape: RuntimeShape): Promise<any>;
    queryObject(id: any, shape: RuntimeShape): Promise<any>;
    private findObject;
}
