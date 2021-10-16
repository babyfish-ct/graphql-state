"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackReferences = void 0;
const SpaceSavingMap_1 = require("../state/impl/SpaceSavingMap");
class BackReferences {
    constructor() {
        // objecs that associate to me
        this.associationOwnerMap = new SpaceSavingMap_1.SpaceSavingMap();
    }
    add(associationField, args, ownerRecord) {
        this
            .associationOwnerMap
            .computeIfAbsent(associationField, () => new SpaceSavingMap_1.SpaceSavingMap())
            .computeIfAbsent(args.key, () => new ParameterizedRecordSet(args))
            .add(ownerRecord);
    }
    remove(associationField, args, ownerRecord) {
        const subMap = this.associationOwnerMap.get(associationField);
        if (subMap !== undefined) {
            const set = subMap === null || subMap === void 0 ? void 0 : subMap.get(args.key);
            if (set !== undefined) {
                set.remove(ownerRecord);
                if (set.isEmtpty) {
                    subMap.remove(args.key);
                    if (subMap.isEmpty) {
                        this.associationOwnerMap.remove(associationField);
                    }
                }
            }
        }
    }
    forEach(callback) {
        this.associationOwnerMap.forEach((field, subMap) => {
            subMap.forEachValue(set => {
                set.forEach(record => {
                    callback(field, set.variables, record);
                });
            });
        });
    }
}
exports.BackReferences = BackReferences;
class ParameterizedRecordSet {
    constructor(variables) {
        this.variables = variables;
        this.records = new Set();
    }
    add(record) {
        this.records.add(record);
    }
    remove(record) {
        this.records.delete(record);
    }
    get isEmtpty() {
        return this.records.size === 0;
    }
    forEach(callback) {
        for (const record of this.records) {
            callback(record);
        }
    }
}
