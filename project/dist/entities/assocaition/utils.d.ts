import { Record } from "../Record";
export declare const QUERY_OBJECT_ID = "unique-id-of-qury-object";
export declare function toRecordMap(arr: ReadonlyArray<Record | undefined> | undefined): Map<any, Record>;
export declare function objectWithOnlyId(record: Record | undefined): any;
