import { Loadable } from "../state/impl/StateValue";
import { ReleasePolicy } from "../state/Types";
import { EntityManager } from "./EntityManager";
import { QueryArgs } from "./QueryArgs";
import { QueryService } from "./QueryService";
export declare class QueryResult {
    readonly entityManager: EntityManager;
    readonly queryArgs: QueryArgs;
    private disposer;
    private _refCount;
    private _promise?;
    protected _loadable: QueryLoadable<any>;
    private _invalid;
    private _refetching;
    private _evictListener;
    private _changeListener;
    protected _currentAsyncRequestId: number;
    private _dependencies?;
    private _disposeTimerId?;
    private _createdMillis;
    private _bindedRefetch;
    constructor(entityManager: EntityManager, queryArgs: QueryArgs, disposer: () => void);
    retain(): this;
    release(releasePolicy?: ReleasePolicy<any>): void;
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
    gcVisit(): void;
    protected createLoadable(loading: boolean, data: any, error: any, additionalValues?: any): QueryLoadable<any>;
    protected createQueryService(): QueryService;
}
export interface QueryLoadable<T> extends Loadable<T> {
    refetch: () => void;
}
