import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataService } from "./AbstractDataService";
export declare class RemoteDataService extends AbstractDataService {
    private pendingRequestMap;
    query(args: QueryArgs): Promise<any>;
    private getPromise;
    " $unregister"(args: QueryArgs): void;
    onLoad(args: QueryArgs): Promise<any>;
    onLoaded(args: QueryArgs, data: any): void;
}
