import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataService } from "./AbstractDataService";
export declare abstract class AbstractDataRequest {
    protected _dataService: AbstractDataService;
    protected _args: QueryArgs;
    private joinedResolvers;
    constructor(_dataService: AbstractDataService, _args: QueryArgs);
    execute(): Promise<void>;
    newPromise(args: QueryArgs): Promise<any>;
    get args(): QueryArgs;
    private resolve;
    private reject;
    private reshape;
}
