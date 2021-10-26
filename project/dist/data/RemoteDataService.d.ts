import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataService } from "./AbstractDataService";
export declare class RemoteDataService extends AbstractDataService {
    private pendingRequestMap;
    query(args: QueryArgs): Promise<void>;
    onExecute(args: QueryArgs): Promise<any>;
    onComplete(args: QueryArgs): void;
}
