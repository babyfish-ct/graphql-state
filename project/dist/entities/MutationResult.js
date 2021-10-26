"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutationResult = void 0;
const graphql_ts_client_api_1 = require("graphql-ts-client-api");
class MutationResult {
    constructor(stateManager, localUpdater, fetcher, variables) {
        this.localUpdater = localUpdater;
        this.fetcher = fetcher;
        this.variables = variables;
        this._currentAsyncRequestId = 0;
        this._loadable = {
            loading: false
        };
        const network = stateManager.network;
        if (network === undefined) {
            throw new Error(`Cannot execute remote data mutation because network is not configured`);
        }
        this._network = network;
        this._bindedMutation = this._muate.bind(this);
    }
    get mutate() {
        return this._bindedMutation;
    }
    get loadable() {
        return this._loadable;
    }
    _muate(variables) {
        return __awaiter(this, void 0, void 0, function* () {
            const aysncRequestId = ++this._currentAsyncRequestId;
            this._loadable = {
                loading: true
            };
            this.localUpdater(old => old + 1);
            try {
                const data = graphql_ts_client_api_1.util.exceptNullValues(yield this._network.execute(this.fetcher, variables !== null && variables !== void 0 ? variables : this.variables));
                if (this._currentAsyncRequestId === aysncRequestId) {
                    this._loadable = {
                        loading: false,
                        data
                    };
                }
                if (this.onSuccess) {
                    this.onSuccess(data);
                }
                return data;
            }
            catch (ex) {
                if (this._currentAsyncRequestId === aysncRequestId) {
                    this._loadable = {
                        loading: false,
                        error: ex
                    };
                }
                if (this.onError) {
                    this.onError(ex);
                }
                throw ex;
            }
            finally {
                if (this.onCompelete) {
                    this.onCompelete(this._loadable.data, this._loadable.error);
                }
                this.localUpdater(old => old + 1);
            }
        });
    }
}
exports.MutationResult = MutationResult;
