import { EntityManager } from "./EntityManager";
import { QueryArgs } from "./QueryArgs";
export declare class QueryService {
    private entityManager;
    private remoteArgsTransformer?;
    constructor(entityManager: EntityManager, remoteArgsTransformer?: ((args: QueryArgs) => QueryArgs) | undefined);
    query(args: QueryArgs, useCache: boolean, useDataService: boolean): RawQueryResult<any>;
    private graph;
    private objects;
    private findObjects;
    private findObject;
    protected loadAndMerge(objMap: Map<string, string>, args: QueryArgs, missedIds: ReadonlyArray<any>): Promise<ReadonlyArray<any>>;
    private tranformRemoteArgs;
    private reloadResponseFromCache;
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
