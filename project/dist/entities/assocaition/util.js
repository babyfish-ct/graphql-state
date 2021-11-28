"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.positionToIndex = exports.toRecordMap = void 0;
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
function positionToIndex(position, maxIndex) {
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
exports.positionToIndex = positionToIndex;
