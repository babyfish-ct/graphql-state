import { ObjectFetcher } from "graphql-ts-client-api";
import { Dispatch, SetStateAction } from "react";
import { MutationResult } from "../../entities/MutationResult";
import { QueryArgs } from "../../entities/QueryArgs";
import { QueryResult } from "../../entities/QueryResult";
import { ParameterizedStateAccessingOptions, State, StateAccessingOptions } from "../State";
import { MutationOptions, QueryOptions } from "../StateHook";
import { QueryResultChangeEvent, StateManagerImpl, StateValueChangeEvent, StateValueChangeListener } from "./StateManagerImpl";
import { StateValue } from "./StateValue";
import { OptionArgs, VariableArgs } from "./Args";

export class StateValueHolder {

    private stateValue?: StateValue;

    private previousOptionArgs?: OptionArgs;

    private stateValueChangeListener?: StateValueChangeListener;

    private deferred?: {
        readonly state: State<any>;
        readonly scopePath: string;
        readonly options?: StateAccessingOptions
    };
    
    constructor(
        private stateManager: StateManagerImpl<any>,
        private scopePath: string,
        private localUpdater: Dispatch<SetStateAction<number>>
    ) {}

    get(): StateValue {
        const value = this.stateValue;
        if (value === undefined) {
            throw new Error("Illegal StateValueHolder that has not been set or has been released");
        }
        return value;
    }

    set(state: State<any>, scopePath: string, options?: StateAccessingOptions) {
        const optionArgs = OptionArgs.of(options);

        if (this.stateValue?.stateInstance?.state[" $name"] === state[" $name"] && 
            this.scopePath === scopePath &&
            this.previousOptionArgs?.key === optionArgs?.key
        ) {
            return;
        }

        if (this.stateValue?.loadable.loading) { // Peak clipping
            this.deferred = {
                state,
                scopePath,
                options
            };
            return;
        }

        this.release();

        this.scopePath = scopePath;
        this.previousOptionArgs = optionArgs;
        this.stateValue = this
            .stateManager
            .scope(scopePath)
            .instance(state, options?.scope ?? "auto")
            .retain(
                VariableArgs.of((options as Partial<ParameterizedStateAccessingOptions<any>>)?.variables)
            );

        this.stateValueChangeListener = (e: StateValueChangeEvent) => {
            if (e.stateValue === this.stateValue) {
                const deferred = this.deferred;
                this.localUpdater(old => old + 1); // Change a local state to update react component
                if (deferred !== undefined && !this.stateValue.loadable.loading) {
                    this.deferred = undefined;
                    this.set(deferred.state, deferred.scopePath, deferred.options);
                }
            }
        };
        this.stateManager.addStateValueChangeListener(this.stateValueChangeListener);
    }

    release() {
        try {
            const listener = this.stateValueChangeListener;
            if (listener !== undefined) {
                this.stateValueChangeListener = undefined;
                this.stateManager.removeStateValueChangeListener(listener);
            }
        } finally {
            const value = this.stateValue;
            if (value !== undefined) {
                this.stateValue = undefined;
                this.previousOptionArgs = undefined;
                value.stateInstance.release(value.args);
            }
        }
    }
}

export class QueryResultHolder {

    private queryResult?: QueryResult;

    private queryResultChangeListener?: (e: QueryResultChangeEvent) => void;

    private deferred?: {
        readonly fetcher: ObjectFetcher<string, object, object>;
        readonly ids?: ReadonlyArray<any>;
        readonly options?: QueryOptions<any, any>;
    };

    constructor(
        private stateManager: StateManagerImpl<any>,
        private localUpdater: Dispatch<SetStateAction<number>>
    ) {}

    get(): QueryResult {
        const result = this.queryResult;
        if (result === undefined) {
            throw new Error("Illegal QueryResultHolder that has not been set or has been released");
        }
        return result;
    }

    set(
        fetcher: ObjectFetcher<string, object, object>,
        ids?: ReadonlyArray<any>,
        options?: QueryOptions<any, any>
    ) {
        const oldQueryArgs = this.queryResult?.queryArgs;
        const newQueryArgs = QueryArgs.create(fetcher, ids, OptionArgs.of(options));

        if (oldQueryArgs?.key === newQueryArgs.key) {
            return;
        }

        if (this.queryResult?.loadable.loading) { //Peak clipping
            this.deferred = { fetcher, ids, options }; 
            return;
        }
        
        // Double check before release(entityManager can validate it too)
        if (!this.stateManager.entityManager.schema.isAcceptable(fetcher.fetchableType)) {
            throw new Error("Cannot accept that fetcher because it is not configured in the state manager");
        }
        this.release();
        
        this.queryResult = this.stateManager.entityManager.retain(newQueryArgs);
        this.queryResultChangeListener = (e: QueryResultChangeEvent) => {
            if (e.queryResult === this.queryResult) {
                const deferred = this.deferred;
                this.localUpdater(old => old + 1); // Change a local state to update react component
                if (deferred !== undefined && !this.queryResult.loadable.loading) {
                    this.deferred = undefined;
                    this.set(deferred.fetcher, deferred.ids, deferred.options);
                }
            }
        };
        
        this.stateManager.addQueryResultChangeListener(this.queryResultChangeListener);
    }

    release() {
        try {
            const listener = this.queryResultChangeListener;
            if (listener !== undefined) {
                this.queryResultChangeListener = undefined;
                this.stateManager.removeQueryResultChangeListener(listener);
            }
        } finally {
            const result = this.queryResult;
            if (result !== undefined) {
                this.queryResult = undefined;
                this.stateManager.entityManager.release(result.queryArgs);
            }
        }
    }
}

export class MutationResultHolder{
    
    private mutationResult?: MutationResult;

    private previousFetcher?: ObjectFetcher<"Mutation", any, any>;

    private previousFetcherJson?: string;

    private previousVariables?: any;

    private previousVariablesArgs?: VariableArgs;

    constructor(
        private stateManager: StateManagerImpl<any>,
        private localUpdater: Dispatch<SetStateAction<number>>
    ) {}

    get(): MutationResult {
        const result = this.mutationResult;
        if (result === undefined) {
            throw new Error("Illegal QueryResultHolder that has not been set or has been released");
        }
        return result;
    }

    set(fetcher: ObjectFetcher<"Mutation", any, any>, options?: MutationOptions<any, any>) {
        let result: MutationResult;
        if (this.isSameFetcher(fetcher) && this.isSameVariables(options?.variables)) {
            result = this.mutationResult!;
        } else {
            result = new MutationResult(this.stateManager, this.localUpdater, fetcher, options?.variables);
            this.mutationResult = result;
            this.localUpdater(old => old + 1);
        }
        result.onSuccess = options?.onSuccess;
        result.onError = options?.onError;
        result.onCompelete = options?.onCompelete;
    }

    private isSameFetcher(fetcher: ObjectFetcher<"Mutation", any, any>): boolean {
        
        if (this.previousFetcher === fetcher) {
            return true;
        }
        
        const json = fetcher.toJSON();
        if (this.previousFetcherJson === json) {
            return true;
        }
        
        this.previousFetcher = fetcher;
        this.previousFetcherJson = json;
        return false;
    }

    private isSameVariables(variables: any): boolean {
        
        if (this.previousVariables === variables) {
            return true;
        }
        
        const args = VariableArgs.of(variables);
        if (this.previousVariablesArgs?.key === args?.key) {
            return true;
        }

        this.previousVariables = variables;
        this.previousVariablesArgs = args;
        return false;
    }
}
