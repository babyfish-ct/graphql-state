import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataService } from "./AbstractDataService";
export declare abstract class AbstractDataRequest {
    private dataService;
    protected _args: QueryArgs;
    private joinedResolvers;
    constructor(dataService: AbstractDataService, _args: QueryArgs);
    execute(): Promise<void>;
    newPromise(): Promise<any>;
    get args(): QueryArgs;
    private resolve;
    private reject;
}
