import { QueryContext } from "../../entities/QueryContext";
import { GraphQLFetcher } from "../../gql/GraphQLFetcher";
import { ParameterizedStateAccessingOptions, State, StateAccessingOptions } from "../State";
import { ComputedStateValue } from "./ComputedStateValue";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValueChangeEvent, StateValueChangeListener } from "./StateManagerImpl";
import { StateValue } from "./StateValue";
import { standardizedVariables } from "./Variables";

export class InternalComputedContext {

    private scope: ScopedStateManager;

    private parent?: InternalComputedContext;

    private dependencies = new Set<StateValue>();

    private closed = false;

    private stateValueChangeListener: StateValueChangeListener;

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
        this.scope.stateManager.addStateChangeListener(this.stateValueChangeListener);
    }

    close() {
        if (!this.closed) {
            this.scope.stateManager.removeStateChangeListener(this.stateValueChangeListener);
            this.closed = true;
            let exception = undefined;
            for (const dep of this.dependencies) {
                try {
                    dep.stateInstance.release(dep.variables);
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
        
        this.dependencies.add(stateValue);
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

    query(...args: any[]): Promise<any> {
        
        if (this.closed) {
            throw new Error("ComputedContext has been closed");
        }

        const graphQLFetcherIndex: number = 
            args[0][" $isGraphQLFetcher"] ? 0 :
            args[1][" $isGraphQLFetcher"] ? 1 :
            -1
        ;

        let id: any = undefined;
        if  (graphQLFetcherIndex === -1 || graphQLFetcherIndex === 1) {
            id = graphQLFetcherIndex === -1 ? args[1] : args[0];
            if (id === undefined || id === null) {
                throw new Error("id cannot be undefined or null");
            }
        }
        const graphQLFetcher = graphQLFetcherIndex !== -1 ? args[graphQLFetcherIndex] : undefined;
        const options = graphQLFetcherIndex === -1 ? args[3] : args[graphQLFetcherIndex + 1];
        
        const queryContext = new QueryContext(this.scope.stateManager.entityManager);
        if (graphQLFetcher !== undefined) {
            if (id === undefined) {
                return queryContext.queryObjectByFetcher(id, graphQLFetcher, options);
            }
            return queryContext.queryByFetcher(graphQLFetcher, options);
        }
        return queryContext.queryObjectByShape(args[0], id, args[2], options);
    }

    private onStateValueChange(e: StateValueChangeEvent) {
        if (e.changedType === "RESULT_CHANGE" && this.dependencies.has(e.stateValue)) {
            this.currentStateValue.invalidate();
        }
    }
}