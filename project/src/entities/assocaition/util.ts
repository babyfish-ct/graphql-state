import { PositionType } from "../..";
import { Record } from "../Record";

export function toRecordMap(arr: ReadonlyArray<Record> | undefined): Map<any, Record> {
    const map = new Map<any, Record>();
    if (arr !== undefined) {
        for (const element of arr) {
            map.set(element.id, element);
        }
    }
    return map;
}

export function positionToIndex(position: PositionType, maxIndex: number): number {
    if (position === 'start') {
        return 0;
    }
    if (position === 'end') {
        return maxIndex;
    }
    if (position <= 0) {
        return 0;
    }
    if (position >= maxIndex) {
        return maxIndex;
    }
    return position;
}