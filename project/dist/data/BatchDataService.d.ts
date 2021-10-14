import { QueryArgs } from "../entities/QueryArgs";
import { AbstractDataService } from "./AbstractDataService";
export declare class BatchDataService extends AbstractDataService {
    private next;
    private shapeRequestMap;
    private submitTimerId?;
    constructor(next: AbstractDataService);
    query(args: QueryArgs): Promise<any>;
    protected onLoad(args: QueryArgs): Promise<any>;
    private willSubmit;
    private submit;
}
