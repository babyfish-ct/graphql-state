import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataRequest } from "./AbstractDataRequest";
import { AbstractDataService } from "./AbstractDataService";

export class BatchDataService extends AbstractDataService {

    private shapeRequestMap = new Map<string, DeferredRequest>();

    private submitTimerId?: NodeJS.Timeout;

    constructor(private next: AbstractDataService) {
        super(next.entityManager);
    }

    query(args: QueryArgs): Promise<any> {
        if (args.ids === undefined) {
            return this.next.query(args);
        }
        let deferredRequest = this.shapeRequestMap.get(args.shape.toString());
        if (deferredRequest === undefined) {
            deferredRequest = new DeferredRequest(this, args);
            this.shapeRequestMap.set(args.shape.toString(), deferredRequest);
            this.willSubmit();
        } else {
            deferredRequest.merge(args.ids);
        }
        return deferredRequest.newPromise();
    }

    protected onLoad(args: QueryArgs): Promise<any> {
        return this.next.query(args);
    }

    private willSubmit() {
        if (this.submitTimerId === undefined) {
            this.submitTimerId = setTimeout(() => {
                this.submit();
                this.submitTimerId = undefined;
            }, 0);
        }
    }

    private submit() {
        for (const [, request] of this.shapeRequestMap) {
            request.execute();
        }
        this.shapeRequestMap.clear();
    }
}

class DeferredRequest extends AbstractDataRequest {

    merge(ids: ReadonlyArray<any>) {
        const mergedIds = new Set(this._args.ids);
        for (const id of ids) {
            mergedIds.add(id);
        }
        this._args = this._args.newArgs(Array.from(mergedIds));
    }
}