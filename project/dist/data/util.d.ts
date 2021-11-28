import { RuntimeShape } from "../entities/RuntimeShape";
import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
export declare function reshapeObject(schema: SchemaMetadata, obj: any, shape: RuntimeShape): any;
export declare class ObjectFilter {
    private schema;
    private data;
    private ids;
    private shape;
    private _objMap;
    constructor(schema: SchemaMetadata, data: any, ids: ReadonlyArray<any> | undefined, shape: RuntimeShape);
    get(ids: ReadonlyArray<any> | undefined): any;
    private get objMap();
    private createObjMap;
}
