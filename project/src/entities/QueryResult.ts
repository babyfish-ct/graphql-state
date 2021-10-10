import { Fetcher } from "graphql-ts-client-api";
import { Loadable } from "../state/impl/StateValue";
import { EntityManager } from "./EntityManager";
import { QueryService } from "./QueryService";
import { RuntimeShape, toRuntimeShape } from "./RuntimeShape";

export class QueryResult {
    
    private _refCount = 0;

    private _promise?: Promise<any>;

    private _loadable: Loadable = { loading: true };

    private _invalid = true;

    private _asyncRequestId = 0;

    constructor(
        readonly entityManager: EntityManager,
        readonly queryArgs: QueryArgs
    ) {}

    retain(): this {
        this._refCount++;
        return this;
    }

    release(): boolean {
        return --this._refCount === 0;
    }

    get promise(): Promise<any> {
        if (this._invalid) {
            let promise: Promise<any>;
            const queryService = new QueryService(this.entityManager);
            if (this.queryArgs.id !== undefined) {
                promise = queryService.queryObject(this.queryArgs.id, this.queryArgs.shape);
            } else {
                promise = queryService.query(this.queryArgs.shape);
            }
            const asyncRequestId = this._asyncRequestId;
            this._promise = 
                promise
                .then(data => {
                    if (this._asyncRequestId === asyncRequestId) {
                        this._loadable = {
                            data,
                            loading: false
                        }
                    }
                    return data;
                })
                .catch(error => {
                    if (this._asyncRequestId === asyncRequestId) {
                        this._loadable = {
                            error,
                            loading: false
                        }
                    }
                    return error;
                })
                .finally(() => {
                    if (this._asyncRequestId === asyncRequestId) {
                        // TODO:
                    }
                });
            this._invalid = false;
        }
        return this._promise!;
    }

    get loadable(): Loadable {
        return this._loadable;
    }
}

export class QueryArgs {

    private _shape: RuntimeShape;

    constructor(
        readonly fetcher: Fetcher<string, object, object>,
        readonly id?: any,
        readonly variables?: any
    ) {
        if (fetcher.fetchableType.name === 'Query' && id !== undefined) {
            throw new Error("Generic query does not support id");
        } else if (fetcher.fetchableType.name !== 'Query' && id === undefined) {
            throw new Error("Id is required for object query");
        }
        this._shape = toRuntimeShape(fetcher, variables);
    }

    get shape(): RuntimeShape {
        return this._shape;
    }
}