import { Loadable } from "../state/impl/StateValue";
import { EntityManager } from "./EntityManager";
import { QueryArgs } from "./QueryArgs";
export declare class QueryResult {
    readonly entityManager: EntityManager;
    readonly queryArgs: QueryArgs;
    private disposer;
    private _refCount;
    private _promise?;
    private _loadable;
    private _invalid;
    private _evictListener;
    private _changeListener;
    private _currentAsyncRequestId;
    private _dependencies?;
    private _disposeTimerId?;
    private _createdMillis;
    constructor(entityManager: EntityManager, queryArgs: QueryArgs, disposer: () => void);
    retain(): this;
    release(maxDelayMillis: number): void;
    get promise(): Promise<any>;
    get loadable(): Loadable;
    private query;
    private refreshDependencies;
    private onEntityEvict;
    private onEntityChange;
    private invalidate;
    private dispose;
}
