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
    private _refetching;
    private _evictListener;
    private _changeListener;
    private _currentAsyncRequestId;
    private _dependencies?;
    private _disposeTimerId?;
    private _createdMillis;
    private _bindedRefetch;
    constructor(entityManager: EntityManager, queryArgs: QueryArgs, disposer: () => void);
    retain(): this;
    release(maxDelayMillis: number): void;
    get promise(): Promise<any>;
    get loadable(): QueryLoadable<any>;
    private execute;
    private query;
    private refreshDependencies;
    private onEntityEvict;
    private onEntityChange;
    private invalidate;
    private dispose;
    private _refetch;
    private get mode();
    private validateData;
}
export interface QueryLoadable<T> extends Loadable<T> {
    refetch: () => void;
}
