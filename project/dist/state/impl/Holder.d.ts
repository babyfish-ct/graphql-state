import { ObjectFetcher } from "graphql-ts-client-api";
import { Dispatch, SetStateAction } from "react";
import { MutationResult } from "../../entities/MutationResult";
import { QueryResult } from "../../entities/QueryResult";
import { State } from "../State";
import { StateManagerImpl } from "./StateManagerImpl";
import { StateValue } from "./StateValue";
import { MutationOptions, QueryOptions, ReleasePolicyOptions, StateAccessingOptions } from "../Types";
export declare class StateValueHolder {
    private stateManager;
    private scopePath;
    private localUpdater;
    private stateValue?;
    private previousOptionArgs?;
    private stateValueChangeListener?;
    private releasePolicy?;
    private deferred?;
    constructor(stateManager: StateManagerImpl<any>, scopePath: string, localUpdater: Dispatch<SetStateAction<number>>);
    get(): StateValue;
    set(state: State<any>, scopePath: string, options?: StateAccessingOptions): void;
    release(): void;
    private serializableOptions;
}
export declare class QueryResultHolder {
    private stateManager;
    private localUpdater;
    private queryResult?;
    private queryResultChangeListener?;
    private releasePolicy?;
    private deferred?;
    constructor(stateManager: StateManagerImpl<any>, localUpdater: Dispatch<SetStateAction<number>>);
    get(): QueryResult;
    set(fetcher: ObjectFetcher<string, object, object>, windowId: string | undefined, ids?: ReadonlyArray<any>, options?: QueryOptions<any> & ReleasePolicyOptions<any>): void;
    release(): void;
    private serializableOptions;
}
export declare class MutationResultHolder {
    private stateManager;
    private localUpdater;
    private mutationResult?;
    private previousFetcher?;
    private previousFetcherJson?;
    private previousVariables?;
    private previousVariablesArgs?;
    constructor(stateManager: StateManagerImpl<any>, localUpdater: Dispatch<SetStateAction<number>>);
    get(): MutationResult;
    set(fetcher: ObjectFetcher<"Mutation", any, any>, options?: MutationOptions<any, any>): void;
    private isSameFetcher;
    private isSameVariables;
}
