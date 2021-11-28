import { ObjectFetcher } from "graphql-ts-client-api";
import { QueryArgs } from "../../entities/QueryArgs";
import { QueryResult } from "../../entities/QueryResult";
import { State } from "../State";
import { ObjectQueryOptions, ParameterizedStateAccessingOptions, QueryOptions, ReleasePolicyOptions, StateAccessingOptions } from "../Types";
import { OptionArgs, VariableArgs } from "./Args";
import { ComputedStateValue } from "./ComputedStateValue";
import { ScopedStateManager } from "./ScopedStateManager";
import { QueryResultChangeEvent, QueryResultChangeListener, StateValueChangeEvent, StateValueChangeListener } from "./StateManagerImpl";
import { StateValue } from "./StateValue";

export class InternalComputedContext {

    private scope: ScopedStateManager;

    private parent?: InternalComputedContext;

    private stateValueDependencies = new Set<StateValue>();

    private queryResultDependencies = new Set<QueryResult>();

    private closed = false;

    private stateValueChangeListener: StateValueChangeListener;

    private queryResultChangeListener: QueryResultChangeListener;

    constructor(
        parent: InternalComputedContext | ScopedStateManager,
        private currentStateValue: ComputedStateValue
    ) {
        if (parent instanceof InternalComputedContext) {
            this.parent = parent;
            this.scope = parent.scope;
        } else {
            this.scope = parent;
        }
        this.stateValueChangeListener = this.onStateValueChange.bind(this);
        this.queryResultChangeListener = this.onQueryResultChange.bind(this);
        this.scope.stateManager.addStateValueChangeListener(this.stateValueChangeListener);
        this.scope.stateManager.addQueryResultChangeListener(this.queryResultChangeListener);
    }

    close() {
        if (!this.closed) {
            this.scope.stateManager.removeQueryResultChangeListener(this.queryResultChangeListener);
            this.scope.stateManager.removeStateValueChangeListener(this.stateValueChangeListener);
            let exception = undefined;
            for (const dep of this.stateValueDependencies) {
                try {
                    dep.stateInstance.release(dep.args);
                } catch (ex) {
                    if (exception === undefined) {
                        exception = ex;
                    }
                }
            }
            const entityManager = this.scope.stateManager.entityManager;
            for (const dep of this.queryResultDependencies) {
                try {
                    entityManager.release(dep.queryArgs);
                } catch (ex) {
                    if (exception === undefined) {
                        exception = ex;
                    }
                }
            }
            if (exception !== undefined) {
                throw exception;
            }
            this.closed = true;
        }
    }

    getSelf(options?: StateAccessingOptions): any {
        const args = VariableArgs.of((options as any)?.variables);
        if (this.currentStateValue.args?.key === args?.key) {
            throw new Error("Cannot get the current state with same variables in the computing implementation, please support another variables");
        }
        return this.get(this.currentStateValue.stateInstance.state, options);
    }
    
    get(state: State<any>, options?: StateAccessingOptions): any {
        if (this.closed) {
            throw new Error("ComputedContext has been closed");
        }

        const args = VariableArgs.of((options as Partial<ParameterizedStateAccessingOptions<any>>)?.variables);
        const stateInstance = this.scope.instance(state, options?.scope ?? "auto");
        const stateValue = stateInstance.retain(args);

        let result: any;
        try {
            result = this.get0(stateValue);
        } catch (ex) {
            stateInstance.release(args);
            throw ex;
        }
        
        this.stateValueDependencies.add(stateValue);
        return result;
    }

    get0(stateValue: StateValue) {
        for (let ctx: InternalComputedContext | undefined = this; ctx !== undefined; ctx = ctx.parent) {
            if (stateValue === ctx.currentStateValue) {
                throw new Error("Computing circular dependencies");
            }
        }
        if (stateValue instanceof ComputedStateValue) {
            return stateValue.compute(this);
        } else {
            return stateValue.result;
        }
    }

    query(
        fetcher: ObjectFetcher<"Query", object, object>, 
        options?: QueryOptions<any> & ReleasePolicyOptions<any>
    ): Promise<any> {
        return this.queryImpl(fetcher, undefined, options);
    }

    object(
        fetcher: ObjectFetcher<string, object, object>, 
        id: any, 
        options?: ObjectQueryOptions<any, any>
    ): Promise<any> {
        return this.queryImpl(fetcher, [id], options)[0];
    }

    objects(
        fetcher: ObjectFetcher<string, object, object>, 
        ids: ReadonlyArray<any>, 
        options?: ObjectQueryOptions<any, any> & ReleasePolicyOptions<any>
    ): Promise<ReadonlyArray<any>> {
        return this.queryImpl(fetcher, ids, options);
    }

    private queryImpl(
        fetcher: ObjectFetcher<string, object, object>, 
        ids: ReadonlyArray<string> | undefined, 
        options?: QueryOptions<any>
    ): Promise<any> {
        
        if (this.closed) {
            throw new Error("ComputedContext has been closed");
        }

        if (fetcher.fetchableType.name === "Query") {
            if (ids !== undefined) {
                throw new Error('Internal bug: Cannot specify is for generic query');
            }
        } else {
            if (ids === undefined) {
                throw new Error('Internal bug: Object query requires "ids"');
            }
        }

        const entityManager = this.scope.stateManager.entityManager;
        const queryResult = entityManager.retain(
            QueryArgs.create(fetcher, undefined, ids, OptionArgs.of(options))
        );
        let promise: Promise<any>;
        try {
            promise = queryResult.promise;
        } catch (ex) {
            entityManager.release(queryResult.queryArgs);
            throw ex;
        }

        this.queryResultDependencies.add(queryResult);
        return promise;
    }

    private onStateValueChange(e: StateValueChangeEvent) {
        if (e.changedType === "RESULT_CHANGE" && this.stateValueDependencies.has(e.stateValue)) {
            this.currentStateValue.invalidate();
        }
    }

    private onQueryResultChange(e: QueryResultChangeEvent) {
        if (e.changedType === "RESULT_CHANGE" && this.queryResultDependencies.has(e.queryResult)) {
            this.currentStateValue.invalidate();
        }
    }
}