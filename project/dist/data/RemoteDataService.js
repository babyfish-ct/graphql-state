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
exports.RemoteDataService = void 0;
const graphql_ts_client_api_1 = require("graphql-ts-client-api");
const AbstractDataRequest_1 = require("./AbstractDataRequest");
const AbstractDataService_1 = require("./AbstractDataService");
class RemoteDataService extends AbstractDataService_1.AbstractDataService {
    constructor() {
        super(...arguments);
        this.pendingRequestMap = new Map();
    }
    query(args) {
        return __awaiter(this, void 0, void 0, function* () {
            let pendingRequest = undefined;
            for (const [, request] of this.pendingRequestMap) {
                if (request.args.contains(args)) {
                    pendingRequest = request;
                    break;
                }
            }
            if (pendingRequest === undefined) {
                pendingRequest = new PendingRequest(this, args);
                this.pendingRequestMap.set(args.key, pendingRequest);
                pendingRequest.execute();
            }
            return pendingRequest.newPromise(args);
        });
    }
    onExecute(args) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const network = this.entityManager.stateManager.network;
            if (network === undefined) {
                throw new Error(`Cannot execute remote data loading because network is not configured`);
            }
            const data = graphql_ts_client_api_1.util.exceptNullValues(yield network.execute(args.fetcher, (_b = (_a = args.optionsArgs) === null || _a === void 0 ? void 0 : _a.variableArgs) === null || _b === void 0 ? void 0 : _b.variables));
            this.entityManager.save(args.shape, data);
            return data;
        });
    }
    onComplete(args) {
        this.pendingRequestMap.delete(args.key);
    }
}
exports.RemoteDataService = RemoteDataService;
class PendingRequest extends AbstractDataRequest_1.AbstractDataRequest {
}
