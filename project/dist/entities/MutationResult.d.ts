import { ObjectFetcher } from "graphql-ts-client-api";
import { Dispatch, SetStateAction } from "react";
import { StateManagerImpl } from "../state/impl/StateManagerImpl";
import { Loadable } from "../state/impl/StateValue";
export declare class MutationResult {
    private localUpdater;
    private fetcher;
    private variables?;
    private _network;
    private _currentAsyncRequestId;
    private _bindedMutation;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    onCompelete?: (data: any, error: any) => void;
    private _loadable;
    constructor(stateManager: StateManagerImpl<any>, localUpdater: Dispatch<SetStateAction<number>>, fetcher: ObjectFetcher<"Mutation", any, any>, variables?: any);
    get mutate(): (variables?: any) => Promise<any>;
    get loadable(): Loadable;
    private _muate;
}
