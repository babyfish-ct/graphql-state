"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toRecordMap = void 0;
function toRecordMap(arr) {
    const map = new Map();
    if (arr !== undefined) {
        for (const element of arr) {
            map.set(element.id, element);
        }
    }
    return map;
}
exports.toRecordMap = toRecordMap;
