import { ObjectFetcher } from "graphql-ts-client-api";
import { Dispatch, SetStateAction } from "react";
import { MutationResult } from "../../entities/MutationResult";
import { QueryArgs } from "../../entities/QueryArgs";
import { QueryResult } from "../../entities/QueryResult";
import { VariableArgs } from "../../entities/VariableArgs";
import { ParameterizedStateAccessingOptions, State, StateAccessingOptions } from "../State";
import { MutationOptions } from "../StateHook";
import { QueryResultChangeEvent, StateManagerImpl, StateValueChangeEvent, StateValueChangeListener } from "./StateManagerImpl";
import { StateValue } from "./StateValue";
import { standardizedVariables } from "./Variables";

export class StateValueHolder {

    private stateValue?: StateValue;

    private previousOptionsJsonText?: string;

    private stateValueChangeListener?: StateValueChangeListener;
    
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

        const newOptionsJsonText = standardizedJsonText(options);

        if (this.stateValue?.stateInstance?.state[" $name"] === state[" $name"] && 
            this.scopePath === scopePath &&
            this.previousOptionsJsonText === newOptionsJsonText
        ) {
            return;
        }

        this.release();

        this.scopePath = scopePath;
        this.previousOptionsJsonText = newOptionsJsonText;
        this.stateValue = this
            .stateManager
            .scope(scopePath)
            .instance(state, options?.scope ?? "auto")
            .retain(
                VariableArgs.of((options as Partial<ParameterizedStateAccessingOptions<any>>)?.variables)
            );

        this.stateValueChangeListener = (e: StateValueChangeEvent) => {
            if (e.stateValue === this.stateValue) {
                this.localUpdater(old => old + 1); // Change a local state to update react component
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
                this.previousOptionsJsonText = undefined;
                value.stateInstance.release(value.args);
            }
        }
    }
}

export class QueryResultHolder {

    private queryResult?: QueryResult;

    private queryResultChangeListener?: (e: QueryResultChangeEvent) => void;

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
        variables?: any    
    ) {
        const oldQueryArgs = this.queryResult?.queryArgs;
        const newQueryArgs = QueryArgs.create(fetcher, ids, variables);
        if (oldQueryArgs?.key === newQueryArgs.key) {
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
                this.localUpdater(old => old + 1); // Change a local state to update react component
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

    private previousVariables?: any;

    private previousFetcherJson?: string;

    private previousVariablesJson?: string;
    
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

    private isSameVariables(variables?: any): boolean {
        if (this.previousVariables === variables) {
            return true;
        }
        const json = standardizedJsonText(variables);
        if (this.previousVariablesJson === json) {
            return true;
        }
        this.previousVariables = variables;
        this.previousVariablesJson = json;
        return false;
    }
}

function standardizedJsonText(obj: any): string | undefined {
    if (obj === undefined || obj === null) {
        return undefined;
    }
    if (typeof obj === "object" && !Array.isArray(obj)) {
        const vs = standardizedVariables(obj);
        return vs !== undefined ? JSON.stringify(vs) : undefined;
    }
    return JSON.stringify(obj);
}
