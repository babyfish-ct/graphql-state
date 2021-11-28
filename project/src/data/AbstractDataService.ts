import { EntityManager } from "../entities/EntityManager";
import { QueryArgs } from "../entities/QueryArgs";

export abstract class AbstractDataService {

    constructor(readonly entityManager: EntityManager) {}

    abstract query(args: QueryArgs): Promise<any>;

    abstract onExecute(args: QueryArgs): Promise<any>;

    abstract onComplete(args: QueryArgs): void;
}
