import { EntityManager } from "./EntityManager";
import { RuntimeShape } from "./RuntimeShape";
export declare class QueryService {
    private entityMangager;
    constructor(entityMangager: EntityManager);
    query(shape: RuntimeShape): RawQueryResult<any>;
    queryObjects(ids: ReadonlyArray<any>, shape: RuntimeShape): RawQueryResult<ReadonlyArray<any>>;
    private findObjects;
    private findObject;
    private loadMissedObjects;
    private loadMissedQuery;
}
export declare type RawQueryResult<T> = CachedResult<T> | DeferredResult<T>;
interface CachedResult<T> {
    readonly type: "cached";
    readonly data: T;
}
interface DeferredResult<T> {
    readonly type: "deferred";
    readonly promise: Promise<T>;
}
export {};
