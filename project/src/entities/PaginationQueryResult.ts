import { ObjectFetcher } from "graphql-ts-client-api";
import { EntityManager } from "./EntityManager";
import { GRAPHQL_STATE_AFTER, GRAPHQL_STATE_BEFORE, GRAPHQL_STATE_FIRST, GRAPHQL_STATE_LAST } from "./PaginationFetcherProcessor";
import { QueryArgs } from "./QueryArgs";
import { QueryLoadable, QueryResult } from "./QueryResult";
import { QueryService } from "./QueryService";

export class PaginationQueryResult extends QueryResult {

    private _bindedLoadNext: () => void;

    private _bindedLoadPrevious: () => void;

    private loadMoreFetcher: ObjectFetcher<"Query", object, object>;

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
        this.loadMoreFetcher = (queryFetcher as any)["addField"](
            this.queryArgs.pagination!.connName,
            connField?.args,
            connField.childFetchers![0],
            connField.fieldOptionsValue
        );
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
        return new QueryService(
            this.entityManager,
            args => {
                const pagination = args.pagination!;
                const loadable = this.loadable as PaginationQueryLoadable<any>;
                const data = loadable.data;
                const conn = this.conn(this._loadable.data);
                if (loadable.isLoadingNext || pagination.style !== "backward") {
                    return args.variables({
                        [GRAPHQL_STATE_FIRST]: data !== undefined ? pagination.pageSize : pagination.initialSize,
                        [GRAPHQL_STATE_AFTER]: loadable.isLoadingNext ? conn?.pageInfo.endCursor : undefined
                    });
                }
                return args.variables({
                    [GRAPHQL_STATE_LAST]: data !== undefined ? pagination.pageSize : pagination.initialSize,
                    [GRAPHQL_STATE_BEFORE]: loadable.isLoadingPrevious ? conn?.pageInfo.startCursor : undefined
                });
            }
        );
    }

    private async loadMore(loadingStatus: "isLoadingNext" | "isLoadingPrevious"): Promise<void> {
        console.log("loadMore.....")
        this._loadable = this.createLoadable(
            false,
            undefined,
            undefined,
            { [loadingStatus]: true }
        );
        this.entityManager.stateManager.publishQueryResultChangeEvent({
            queryResult: this,
            changedType: "ASYNC_STATE_CHANGE"
        });
        try {
            console.log("result.....")
            const result = this.createQueryService().query(
                QueryArgs.create(
                    this.loadMoreFetcher, 
                    this.entityManager.schema, 
                    undefined, 
                    this.queryArgs.optionArgs
                ), 
                false, 
                true
            );
            if (result.type !== "deferred") {
                throw new Error("Internal bug: LoadMore only accept deferred result");
            }
            const data = await result.promise;
            console.log("wait.....", data);
            this._loadable = this.createLoadable(
                false,
                data,
                undefined,
                { [loadingStatus]: false }
            );
        } catch (ex) {
            console.log("ex.....", ex)
            this._loadable = this.createLoadable(
                false,
                undefined,
                ex,
                { [loadingStatus]: false }
            );
        } finally {
            this.entityManager.stateManager.publishQueryResultChangeEvent({
                queryResult: this,
                changedType: "ASYNC_STATE_CHANGE"
            }); 
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