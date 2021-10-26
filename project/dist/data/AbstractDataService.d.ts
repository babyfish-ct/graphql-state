import { EntityManager } from "../entities/EntityManager";
import { QueryArgs } from "../entities/QueryArgs";
export declare abstract class AbstractDataService {
    readonly entityManager: EntityManager;
    constructor(entityManager: EntityManager);
    abstract query(args: QueryArgs): Promise<any>;
    abstract onExecute(args: QueryArgs): Promise<any>;
    abstract onComplete(args: QueryArgs): void;
}
