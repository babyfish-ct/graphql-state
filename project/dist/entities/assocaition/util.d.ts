import { PositionType } from "../..";
import { Record } from "../Record";
export declare function toRecordMap(arr: ReadonlyArray<Record> | undefined): Map<any, Record>;
export declare function positionToIndex(position: PositionType, maxIndex: number): number;
