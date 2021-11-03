import { EntityManager } from "./EntityManager";
import { QueryArgs } from "./QueryArgs";
import { QueryLoadable, QueryResult } from "./QueryResult";
import { QueryService } from "./QueryService";
export declare class PaginationQueryResult extends QueryResult {
    private _bindedLoadNext;
    private _bindedLoadPrevious;
    private _loadNextQueryArgs;
    private _loadPreviousQueryArgs;
    private _loadMoreRequestId;
    constructor(entityManager: EntityManager, queryArgs: QueryArgs, disposer: () => void);
    protected createLoadable(loading: boolean, data: any, error: any, additionalValues?: any): PaginationQueryLoadable<any>;
    protected createQueryService(): QueryService;
    private createPagiantionQueryService;
    private loadMore;
    private loadNext;
    private loadPrevious;
    private conn;
}
export interface PaginationQueryLoadable<T> extends QueryLoadable<T> {
    readonly loadNext: () => void;
    readonly loadPrevious: () => void;
    readonly hasNext: boolean;
    readonly hasPrevious: boolean;
    readonly isLoadingNext: boolean;
    readonly isLoadingPrevious: boolean;
}
