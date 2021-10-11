import { EntityManager } from "./EntityManager";
import { RuntimeShape } from "./RuntimeShape";
export declare class QueryService {
    private entityMangager;
    constructor(entityMangager: EntityManager);
    query(shape: RuntimeShape): Promise<any>;
    queryObjects(ids: ReadonlyArray<any>, shape: RuntimeShape): Promise<ReadonlyArray<any>>;
    private findObjects;
    private findObject;
}
