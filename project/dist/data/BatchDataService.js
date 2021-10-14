"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchDataService = void 0;
const AbstractDataRequest_1 = require("./AbstractDataRequest");
const AbstractDataService_1 = require("./AbstractDataService");
class BatchDataService extends AbstractDataService_1.AbstractDataService {
    constructor(next) {
        super(next.entityManager);
        this.next = next;
        this.shapeRequestMap = new Map();
    }
    query(args) {
        if (args.ids === undefined) {
            return this.next.query(args);
        }
        let deferredRequest = this.shapeRequestMap.get(args.shape.toString());
        if (deferredRequest === undefined) {
            deferredRequest = new DeferredRequest(this, args);
            this.shapeRequestMap.set(args.shape.toString(), deferredRequest);
            this.willSubmit();
        }
        else {
            deferredRequest.merge(args.ids);
        }
        return deferredRequest.newPromise();
    }
    onLoad(args) {
        return this.next.query(args);
    }
    willSubmit() {
        if (this.submitTimerId === undefined) {
            this.submitTimerId = setTimeout(() => {
                this.submit();
                this.submitTimerId = undefined;
            }, 0);
        }
    }
    submit() {
        for (const [, request] of this.shapeRequestMap) {
            request.execute();
        }
        this.shapeRequestMap.clear();
    }
}
exports.BatchDataService = BatchDataService;
class DeferredRequest extends AbstractDataRequest_1.AbstractDataRequest {
    merge(ids) {
        const mergedIds = new Set(this._args.ids);
        for (const id of ids) {
            mergedIds.add(id);
        }
        this._args = this._args.newArgs(Array.from(mergedIds));
    }
}
