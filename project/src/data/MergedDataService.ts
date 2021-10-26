import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataRequest } from "./AbstractDataRequest";
import { AbstractDataService } from "./AbstractDataService";

export class MergedDataService extends AbstractDataService {

    private deferredQueryRequests: DeferredQueryRequest[] = [];

    private querySubmitTimmrId?: NodeJS.Timeout;

    private deferredObjectRequestMap = new Map<string, DeferredObjectRequest>();

    private objectSubmitTimerId?: NodeJS.Timeout;

    constructor(private next: AbstractDataService) {
        super(next.entityManager);
    }

    query(args: QueryArgs): Promise<any> {
        return args.ids === undefined ? 
            this.queryPromise(args) : 
            this.objectPromise(args);
    }

    private queryPromise(args: QueryArgs): Promise<any> {
        let deferredRequest: DeferredQueryRequest | undefined = undefined;
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

    private willSubmitQueryRequests() {
        if (this.querySubmitTimmrId === undefined) {
            this.querySubmitTimmrId = setTimeout(() => {
                this.submitQueryRequests();
                this.querySubmitTimmrId = undefined;
            }, 0);
        }
    }

    private submitQueryRequests() {
        for (const request of this.deferredQueryRequests) {
            request.execute();
        }
        this.deferredQueryRequests = [];
    }

    private objectPromise(args: QueryArgs): Promise<any> {
        let deferredRequest = this.deferredObjectRequestMap.get(args.shape.toString());
        if (deferredRequest === undefined) {
            deferredRequest = new DeferredObjectRequest(this, args);
            this.deferredObjectRequestMap.set(args.shape.toString(), deferredRequest);
            this.willSubmitObjectRequests();
        } else {
            deferredRequest.merge(args.ids!);
        }
        return deferredRequest.newPromise(args);
    }

    private willSubmitObjectRequests() {
        if (this.objectSubmitTimerId === undefined) {
            this.objectSubmitTimerId = setTimeout(() => {
                this.submitObjectRequests();
                this.objectSubmitTimerId = undefined;
            }, 0);
        }
    }

    private submitObjectRequests() {
        for (const [, request] of this.deferredObjectRequestMap) {
            request.execute();
        }
        this.deferredObjectRequestMap.clear();
    }

    onExecute(args: QueryArgs): Promise<any> {
        return this.next.query(args);
    }

    onComplete(args: QueryArgs) {
        this.next.onComplete(args);
    }
}

class DeferredQueryRequest extends AbstractDataRequest {

    reuse(args: QueryArgs): boolean {
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

class DeferredObjectRequest extends AbstractDataRequest {

    merge(ids: ReadonlyArray<any>) {
        const mergedIds = new Set(this._args.ids);
        for (const id of ids) {
            mergedIds.add(id);
        }
        this._args = this._args.newArgs(Array.from(mergedIds));
    }
}