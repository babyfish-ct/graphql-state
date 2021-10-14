import { ObjectFetcher } from "graphql-ts-client-api";
import { Dispatch, SetStateAction } from "react";
import { QueryArgs } from "../../entities/QueryArgs";
import { QueryResult } from "../../entities/QueryResult";
import { ParameterizedStateAccessingOptions, State, StateAccessingOptions } from "../State";
import { QueryResultChangeEvent, StateManagerImpl, StateValueChangeEvent, StateValueChangeListener } from "./StateManagerImpl";
import { StateValue } from "./StateValue";
import { standardizedVariables } from "./Variables";

export class StateValueHolder {

    private stateValue?: StateValue;

    private previousOptionsJsonText?: string;

    private stateValueChangeListener?: StateValueChangeListener;
    
    constructor(
        private stateManager: StateManagerImpl<any>,
        private localUpdater: Dispatch<SetStateAction<number>>
    ) {}

    get(): StateValue {
        const value = this.stateValue;
        if (value === undefined) {
            throw new Error("Illegal StateValueHolder that has not been set or has been released");
        }
        return value;
    }

    set(state: State<any>, options?: StateAccessingOptions) {

        const newOptionsJsonText = standardizedJsonText(options);

        if (this.stateValue?.stateInstance?.state === state && 
            this.previousOptionsJsonText === newOptionsJsonText
        ) {
            return;
        }

        this.release();

        const vs = standardizedVariables((options as Partial<ParameterizedStateAccessingOptions<any>>)?.variables);
        const vsCode = vs !== undefined ? JSON.stringify(vs) : undefined;

        this.previousOptionsJsonText = newOptionsJsonText;
        this.stateValue = this
            .stateManager
            .scope
            .instance(state, options?.propagation ?? "REQUIRED")
            .retain(vsCode, vs);

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
                value.stateInstance.release(value.variablesCode);
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
