import { EntityManager } from "../entities/EntityManager";
import { QueryArgs } from "../entities/QueryArgs";
export declare abstract class AbstractDataService {
    readonly entityManager: EntityManager;
    constructor(entityManager: EntityManager);
    abstract query(args: QueryArgs): Promise<any>;
    toObjectMap(data: any, args: QueryArgs): Map<any, any>;
    protected standardizedResult(data: any, args: QueryArgs, reshapeObject?: boolean): any;
    private reshapeObject;
    private reshapeConnnection;
    protected abstract onLoad(args: QueryArgs): Promise<any>;
    protected onLoaded(args: QueryArgs, data: any): void;
}
