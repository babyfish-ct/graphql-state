import { ObjectFetcher } from "graphql-ts-client-api";
import { EntityManager } from "./EntityManager";
import { GRAPHQL_STATE_AFTER, GRAPHQL_STATE_BEFORE, GRAPHQL_STATE_FIRST, GRAPHQL_STATE_LAST } from "./PaginationFetcherProcessor";
import { QueryArgs } from "./QueryArgs";
import { QueryLoadable, QueryResult } from "./QueryResult";
import { QueryService } from "./QueryService";

export class PaginationQueryResult extends QueryResult {

    private _bindedLoadNext: () => void;

    private _bindedLoadPrevious: () => void;

    private _loadNextQueryArgs: QueryArgs;

    private _loadPreviousQueryArgs: QueryArgs;

    private _loadMoreRequestId = 0;

    constructor(
        entityManager: EntityManager,
        queryArgs: QueryArgs,
        disposer: () => void
    ) {
        super(entityManager, queryArgs, disposer);
        
        this._bindedLoadNext = this.loadNext.bind(this);
        this._bindedLoadPrevious = this.loadPrevious.bind(this);
        
        const queryFetcher = this.entityManager.schema.fetcher("Query");
        const connField = this.queryArgs.fetcher.fieldMap.get(this.queryArgs.pagination!.connName)!;
        const loadMoreFetcher = (queryFetcher as any)["addField"](
            this.queryArgs.pagination!.connName,
            connField?.args,
            connField.childFetchers![0],
            connField.fieldOptionsValue
        );
        this._loadNextQueryArgs = QueryArgs.create(
            loadMoreFetcher, 
            { schema: this.entityManager.schema, loadMode: "next" }, 
            undefined, 
            this.queryArgs.optionArgs
        );
        this._loadPreviousQueryArgs = QueryArgs.create(
            loadMoreFetcher, 
            { schema: this.entityManager.schema, loadMode: "previous" }, 
            undefined, 
            this.queryArgs.optionArgs
        )
    }

    protected createLoadable(
        loading: boolean,
        data: any,
        error: any,
        additionalValues?: any
    ): PaginationQueryLoadable<any> {
        return super.createLoadable(loading, data, error, {
            loadNext: this._bindedLoadNext,
            loadPrevious: this._bindedLoadPrevious,
            hasNext: this.conn(data)?.pageInfo?.hasNextPage ?? false,
            hasPrevious: this.conn(data)?.pageInfo?.hasPreviousPage ?? false,
            isLoadingNext: false,
            isLoadingPrevious: false,
            ...additionalValues
        }) as PaginationQueryLoadable<any>;
    }

    protected createQueryService(): QueryService {
        return this.createPagiantionQueryService(undefined);
    }

    private createPagiantionQueryService(data: any): QueryService {
        const conn = this.conn(data ?? this._loadable.data);
        return new QueryService(
            this.entityManager,
            args => {
                const pagination = args.pagination!;
                if (pagination.loadMode === "previous" || pagination.style === "backward") {
                    return args.variables({
                        [GRAPHQL_STATE_LAST]: pagination.loadMode === "initial" ? pagination.initialSize : pagination.pageSize,
                        [GRAPHQL_STATE_BEFORE]: pagination.loadMode === "initial" ? undefined : conn?.pageInfo?.startCursor
                    });
                }
                return args.variables({
                    [GRAPHQL_STATE_FIRST]: pagination.loadMode === "initial" ? pagination.initialSize : pagination.pageSize,
                    [GRAPHQL_STATE_AFTER]: pagination.loadMode === "initial" ? undefined : conn?.pageInfo?.endCursor
                });
            }
        );
    }

    private async loadMore(loadingStatus: "isLoadingNext" | "isLoadingPrevious"): Promise<void> {
        const queryService = this.createPagiantionQueryService(this._loadable.data); // Create before "_loadable" reset
        this._loadable = this.createLoadable(
            false,
            this._loadable.data,
            this._loadable.error,
            { [loadingStatus]: true }
        );
        this.entityManager.stateManager.publishQueryResultChangeEvent({
            queryResult: this,
            changedType: "ASYNC_STATE_CHANGE"
        });
        const requestId = ++this._loadMoreRequestId;
        try {
            const result = queryService.query(
                loadingStatus === "isLoadingNext" ? this._loadNextQueryArgs : this._loadPreviousQueryArgs, 
                false, 
                true
            );
            if (result.type !== "deferred") {
                throw new Error("Internal bug: LoadMore only accept deferred result");
            }
            const data = await result.promise;
            if (this._loadMoreRequestId === requestId) {
                this._loadable = this.createLoadable(
                    false,
                    data,
                    undefined,
                    { [loadingStatus]: false }
                );
            }
        } catch (ex) {
            if (this._loadMoreRequestId === requestId) {
                this._loadable = this.createLoadable(
                    false,
                    undefined,
                    ex,
                    { [loadingStatus]: false }
                );
            }
            throw ex;
        } finally {
            if (this._loadMoreRequestId === requestId) {
                this.entityManager.stateManager.publishQueryResultChangeEvent({
                    queryResult: this,
                    changedType: "ASYNC_STATE_CHANGE"
                }); 
            }
        }
    }

    private async loadNext() {
        const loadable = this.loadable as PaginationQueryLoadable<any>;
        if (loadable.hasNext) {
            this.loadMore("isLoadingNext");
        }
    }

    private async loadPrevious() {
        const loadable = this.loadable as PaginationQueryLoadable<any>;
        if (loadable.hasPrevious) {
            this.loadMore("isLoadingPrevious");
        }
    }

    private conn(data: any): any {
        const pagination = this.queryArgs.pagination!;
        return data === undefined ? 
            undefined : 
            data[pagination.connAlias ?? pagination.connName];
    }
}

export interface PaginationQueryLoadable<T> extends QueryLoadable<T> {
    readonly loadNext: () => void;
    readonly loadPrevious: () => void;
    readonly hasNext: boolean;
    readonly hasPrevious: boolean;
    readonly isLoadingNext: boolean;
    readonly isLoadingPrevious: boolean
}