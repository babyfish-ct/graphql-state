import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataService } from "./AbstractDataService";
export declare class MergedDataService extends AbstractDataService {
    private next;
    private deferredQueryRequests;
    private querySubmitTimmrId?;
    private deferredObjectRequestMap;
    private objectSubmitTimerId?;
    constructor(next: AbstractDataService);
    query(args: QueryArgs): Promise<any>;
    private queryPromise;
    private willSubmitQueryRequests;
    private submitQueryRequests;
    private objectPromise;
    private willSubmitObjectRequests;
    private submitObjectRequests;
    onExecute(args: QueryArgs): Promise<any>;
    onComplete(args: QueryArgs): void;
}
