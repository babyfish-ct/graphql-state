import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataService } from "./AbstractDataService";
export declare class RemoteDataService extends AbstractDataService {
    private pendingRequestMap;
    query(args: QueryArgs): Promise<any>;
    private getPromise;
    onExecute(args: QueryArgs): Promise<any>;
    onExecuted(args: QueryArgs, data: any): void;
    onComplete(args: QueryArgs): void;
}
