import { EntityManager } from "./EntityManager";
import { QueryArgs } from "./QueryArgs";
export declare class RemoteService {
    readonly entityManager: EntityManager;
    private pendingRequestMap;
    constructor(entityManager: EntityManager);
    query(args: QueryArgs): Promise<any>;
    private sharedPromise;
    " $unregister"(args: QueryArgs): void;
    toObjectMap(data: any, args: QueryArgs): Map<any, any>;
    private reshape;
    private reshapeObject;
    private reshapeConnnection;
}
