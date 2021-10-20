import { Loadable } from "../state/impl/StateValue";
import { EntityManager } from "./EntityManager";
import { QueryArgs } from "./QueryArgs";
export declare class QueryResult {
    readonly entityManager: EntityManager;
    readonly queryArgs: QueryArgs;
    private _refCount;
    private _promise?;
    private _loadable;
    private _invalid;
    private _evictListener;
    private _changeListener;
    private _currentAsyncRequestId;
    private _dependencies?;
    constructor(entityManager: EntityManager, queryArgs: QueryArgs);
    retain(): this;
    release(): boolean;
    get promise(): Promise<any>;
    get loadable(): Loadable;
    private query;
    private refreshDependencies;
    private onEntityEvict;
    private onEntityChange;
    private invalidate;
}
