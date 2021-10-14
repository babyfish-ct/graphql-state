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
const AbstractDataRequest_1 = require("./AbstractDataRequest");
const AbstractDataService_1 = require("./AbstractDataService");
class RemoteDataService extends AbstractDataService_1.AbstractDataService {
    constructor() {
        super(...arguments);
        this.pendingRequestMap = new Map();
    }
    query(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const [promise, primary] = this.getPromise(args);
            const data = yield promise;
            return this.standardizedResult(data, args, !primary);
        });
    }
    getPromise(args) {
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
            return [pendingRequest.newPromise(), true];
        }
        return [pendingRequest.newPromise(), false];
    }
    " $unregister"(args) {
        this.pendingRequestMap.delete(args.key);
    }
    onLoad(args) {
        return this.entityManager.loadRemoteData(args);
    }
    onLoaded(args, data) {
        const entityManager = this.entityManager;
        const shape = args.shape;
        const ids = args.ids;
        if (ids === undefined) {
            entityManager.save(shape, data);
        }
        else {
            const objMap = this.toObjectMap(data, args);
            entityManager.modify(() => {
                for (const id of ids) {
                    const obj = objMap.get(id);
                    if (obj !== undefined) {
                        entityManager.save(shape, obj);
                    }
                    else {
                        entityManager.delete(shape.typeName, id);
                    }
                }
            });
        }
    }
}
exports.RemoteDataService = RemoteDataService;
class PendingRequest extends AbstractDataRequest_1.AbstractDataRequest {
}
