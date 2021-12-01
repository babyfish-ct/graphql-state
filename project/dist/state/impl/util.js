"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compare = void 0;
function compare(a, b, field) {
    const aField = a[field];
    const bField = b[field];
    if (aField < bField) {
        return -1;
    }
    if (aField > bField) {
        return +1;
    }
    return 0;
}
exports.compare = compare;
