"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectWithOnlyId = exports.toRecordMap = exports.QUERY_OBJECT_ID = void 0;
exports.QUERY_OBJECT_ID = "unique-id-of-qury-object";
function toRecordMap(arr) {
    const map = new Map();
    if (arr !== undefined) {
        for (const element of arr) {
            if (element !== undefined) {
                map.set(element.id, element);
            }
        }
    }
    return map;
}
exports.toRecordMap = toRecordMap;
function objectWithOnlyId(record) {
    if (record === undefined) {
        return undefined;
    }
    return { [record.type.idField.name]: record.id };
}
exports.objectWithOnlyId = objectWithOnlyId;
