import { ObjectFetcher } from "graphql-ts-client-api";
import { Dispatch, SetStateAction } from "react";
import { QueryResult } from "../../entities/QueryResult";
import { State, StateAccessingOptions } from "../State";
import { StateManagerImpl } from "./StateManagerImpl";
import { StateValue } from "./StateValue";
export declare class StateValueHolder {
    private stateManager;
    private localUpdater;
    private stateValue?;
    private previousOptionsJsonText?;
    private stateValueChangeListener?;
    constructor(stateManager: StateManagerImpl<any>, localUpdater: Dispatch<SetStateAction<number>>);
    get(): StateValue;
    set(state: State<any>, options?: StateAccessingOptions): void;
    release(): void;
}
export declare class QueryResultHolder {
    private stateManager;
    private localUpdater;
    private queryResult?;
    private queryResultChangeListener?;
    constructor(stateManager: StateManagerImpl<any>, localUpdater: Dispatch<SetStateAction<number>>);
    get(): QueryResult;
    set(fetcher: ObjectFetcher<string, object, object>, ids?: ReadonlyArray<any>, variables?: any): void;
    release(): void;
}
