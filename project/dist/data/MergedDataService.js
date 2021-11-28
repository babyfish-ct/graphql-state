"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergedDataService = void 0;
const AbstractDataRequest_1 = require("./AbstractDataRequest");
const AbstractDataService_1 = require("./AbstractDataService");
class MergedDataService extends AbstractDataService_1.AbstractDataService {
    constructor(next) {
        super(next.entityManager);
        this.next = next;
        this.deferredQueryRequests = [];
        this.deferredObjectRequestMap = new Map();
    }
    query(args) {
        return args.ids === undefined ?
            this.queryPromise(args) :
            this.objectPromise(args);
    }
    queryPromise(args) {
        let deferredRequest = undefined;
        for (const request of this.deferredQueryRequests) {
            if (request.reuse(args)) {
                deferredRequest = request;
                break;
            }
        }
        if (deferredRequest === undefined) {
            deferredRequest = new DeferredQueryRequest(this, args);
            this.deferredQueryRequests.push(deferredRequest);
            this.willSubmitQueryRequests();
        }
        return deferredRequest.newPromise(args);
    }
    willSubmitQueryRequests() {
        if (this.querySubmitTimmrId === undefined) {
            this.querySubmitTimmrId = setTimeout(() => {
                this.submitQueryRequests();
                this.querySubmitTimmrId = undefined;
            }, 0);
        }
    }
    submitQueryRequests() {
        for (const request of this.deferredQueryRequests) {
            request.execute();
        }
        this.deferredQueryRequests = [];
    }
    objectPromise(args) {
        let deferredRequest = this.deferredObjectRequestMap.get(args.shape.toString());
        if (deferredRequest === undefined) {
            deferredRequest = new DeferredObjectRequest(this, args);
            this.deferredObjectRequestMap.set(args.shape.toString(), deferredRequest);
            this.willSubmitObjectRequests();
        }
        else {
            deferredRequest.merge(args.ids);
        }
        return deferredRequest.newPromise(args);
    }
    willSubmitObjectRequests() {
        if (this.objectSubmitTimerId === undefined) {
            this.objectSubmitTimerId = setTimeout(() => {
                this.submitObjectRequests();
                this.objectSubmitTimerId = undefined;
            }, 0);
        }
    }
    submitObjectRequests() {
        for (const [, request] of this.deferredObjectRequestMap) {
            request.execute();
        }
        this.deferredObjectRequestMap.clear();
    }
    onExecute(args) {
        return this.next.query(args);
    }
    onComplete(args) {
        this.next.onComplete(args);
    }
}
exports.MergedDataService = MergedDataService;
class DeferredQueryRequest extends AbstractDataRequest_1.AbstractDataRequest {
    reuse(args) {
        if (this._args.contains(args)) {
            return true;
        }
        if (args.contains(this._args)) {
            this._args = args;
            return true;
        }
        return false;
    }
}
class DeferredObjectRequest extends AbstractDataRequest_1.AbstractDataRequest {
    merge(ids) {
        const mergedIds = new Set(this._args.ids);
        for (const id of ids) {
            mergedIds.add(id);
        }
        this._args = this._args.newArgs(Array.from(mergedIds));
    }
}
