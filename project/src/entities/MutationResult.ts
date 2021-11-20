import { ObjectFetcher, util } from "graphql-ts-client-api";
import { Dispatch, SetStateAction } from "react";
import { Network } from "..";
import { StateManagerImpl } from "../state/impl/StateManagerImpl";
import { Loadable } from "../state/impl/StateValue";

export class MutationResult {

    private _network: Network;

    private _currentAsyncRequestId = 0;

    private _bindedMutation: (variables?: any) => Promise<any>;

    onSuccess?: (data: any) => void;
    
    onError?: (error: any) => void;

    onCompelete?: (data: any, error: any) => void;

    private _loadable: Loadable = {
        loading: false
    }

    constructor(
        stateManager: StateManagerImpl<any>,
        private localUpdater: Dispatch<SetStateAction<number>>,
        private fetcher: ObjectFetcher<"Mutation", any, any>,
        private variables?: any,
    ) {
        const network = stateManager.network;
        if (network === undefined) {
            throw new Error(`Cannot execute remote data mutation because network is not configured`);
        }
        this._network = network;
        this._bindedMutation = this._muate.bind(this);
    }

    get mutate(): (variables?: any) => Promise<any> {
        return this._bindedMutation;
    }

    get loadable(): Loadable {
        return this._loadable;
    }

    private async _muate(variables?: any): Promise<any> {
        const aysncRequestId = ++this._currentAsyncRequestId;
        this._loadable = {
            loading: true
        };
        this.localUpdater(old => old + 1);
        try {
            const data = util.exceptNullValues(
                await this._network.execute(this.fetcher, variables ?? this.variables)
            );
            if (this._currentAsyncRequestId === aysncRequestId) {
                this._loadable = {
                    loading: false,
                    data
                }
            }
            if (this.onSuccess) {
                this.onSuccess(data);
            }
            return data;
        } catch (ex) {
            if (this._currentAsyncRequestId === aysncRequestId) {
                this._loadable = {
                    loading: false,
                    error: ex
                }
            }
            if (this.onError) {
                this.onError(ex);
            }
            throw ex;
        } finally {
            if (this.onCompelete) {
                this.onCompelete(this._loadable.data, this._loadable.error);
            }
            this.localUpdater(old => old + 1);
        }
    }
}