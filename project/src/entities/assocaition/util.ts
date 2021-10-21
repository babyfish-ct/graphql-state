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
