import { ObjectFetcher } from "graphql-ts-client-api";
import { QueryArgs } from "../../entities/QueryArgs";
import { QueryResult } from "../../entities/QueryResult";
import { ParameterizedStateAccessingOptions, State, StateAccessingOptions } from "../State";
import { ComputedStateValue } from "./ComputedStateValue";
import { ScopedStateManager } from "./ScopedStateManager";
import { QueryResultChangeEvent, QueryResultChangeListener, StateValueChangeEvent, StateValueChangeListener } from "./StateManagerImpl";
import { StateValue } from "./StateValue";
import { standardizedVariables } from "./Variables";

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
            this.closed = true;
            let exception = undefined;
            for (const dep of this.stateValueDependencies) {
                try {
                    dep.stateInstance.release(dep.variables);
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
        }
    }

    getSelf(options?: StateAccessingOptions): any {
        const variables = standardizedVariables((options as any)?.variables);
        const variablesCode = variables !== undefined ? JSON.stringify(variables) : undefined;
        if (this.currentStateValue.variablesCode === variablesCode) {
            throw new Error("Cannot get the current state with same variables in the computing implementation, please support another variables");
        }
        return this.get(this.currentStateValue.stateInstance.state, options);
    }
    
    get(state: State<any>, options?: StateAccessingOptions): any {
        if (this.closed) {
            throw new Error("ComputedContext has been closed");
        }

        const variables = standardizedVariables((options as Partial<ParameterizedStateAccessingOptions<any>>)?.variables);
        const variablesCode = variables !== undefined ? JSON.stringify(variables) : undefined;
        const stateInstance = this.scope.instance(state, options?.propagation ?? "REQUIRED");
        const stateValue = stateInstance.retain(variablesCode, variables);

        let result: any;
        try {
            result = this.get0(stateValue);
        } catch (ex) {
            stateInstance.release(variablesCode);
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

    object(fetcher: ObjectFetcher<string, object, object>, id: any, variables?: any): Promise<any> {
        return this.objects(fetcher, [id], variables)[0];
    }

    objects(fetcher: ObjectFetcher<string, object, object>, ids: ReadonlyArray<any>, variables?: any): Promise<ReadonlyArray<any>> {
        
        if (this.closed) {
            throw new Error("ComputedContext has been closed");
        }

        const entityManager = this.scope.stateManager.entityManager;
        const queryResult = entityManager.retain(QueryArgs.create(fetcher, ids, variables));
        let result: any;
        try {
            result = queryResult.promise;
        } catch (ex) {
            entityManager.release(queryResult.queryArgs);
        }

        this.queryResultDependencies.add(queryResult);
        return result;
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