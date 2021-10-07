"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModificationContext = void 0;
class ModificationContext {
    constructor() {
        this.objPairMap = new Map();
    }
    fireEvents(trigger) {
        var _a;
        for (const [type, subMap] of this.objPairMap) {
            for (const [id, objectPair] of subMap) {
                const fieldNames = new Set();
                const oldValueMap = new Map();
                const newValueMap = new Map();
                if (objectPair.newObj !== undefined) {
                    for (const [fieldName, newValue] of objectPair.newObj) {
                        const oldValue = (_a = objectPair.oldObj) === null || _a === void 0 ? void 0 : _a.get(fieldName);
                        fieldNames.add(fieldName);
                        if (oldValue !== undefined) {
                            oldValueMap.set(fieldName, oldValue);
                        }
                        if (newValue !== undefined) {
                            newValueMap.set(fieldName, newValue);
                        }
                    }
                }
                else if (objectPair.oldObj !== undefined) {
                    for (const [fieldName, oldValue] of objectPair.oldObj) {
                        fieldNames.add(fieldName);
                        if (oldValue !== undefined) {
                            oldValueMap.set(fieldName, oldValue);
                        }
                    }
                }
                if (oldValueMap.size !== 0 || newValueMap.size !== 0) {
                    // const event = new EntityChangeEventImpl(
                    //     type.name,
                    //     id,
                    //     objectPair.oldObj !== undefined && objectPair.newObj !== undefined ? 
                    //     "UPDATE" : (
                    //         objectPair.newObj !== undefined ? "INSERT" : "DELETE"
                    //     ),
                    //     fieldNames,
                    //     oldValueMap.size === 0 ? undefined : oldValueMap,
                    //     newValueMap.size === 0 ? undefined : newValueMap
                    // );
                    // trigger(event);
                }
            }
        }
    }
    insert(record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, false);
            if (pair.newObj === undefined) {
                pair.newObj = new Map();
            }
        }
    }
    update(record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, true);
            if (pair.newObj === undefined) {
                pair.newObj = new Map();
            }
        }
    }
    delete(record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, true);
            if (pair.oldObj === undefined) {
                pair.oldObj = new Map();
            }
        }
    }
    change(record, fieldName, oldValue, newValue) {
        var _a, _b;
        if (fieldName === record.type.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        if (oldValue !== newValue) {
            const pair = (_a = this.objPairMap.get(record.type.rootType)) === null || _a === void 0 ? void 0 : _a.get(record.id);
            if (pair === undefined) {
                throw new Error("Internal bug: the changed record is not cached in ModiciationContext");
            }
            if (pair.oldObj !== undefined && !pair.oldObj.has(fieldName)) {
                pair.oldObj.set(fieldName, oldValue);
            }
            (_b = pair.newObj) === null || _b === void 0 ? void 0 : _b.set(fieldName, newValue);
        }
    }
    pair(record, initializeOldObj) {
        const key = record.type.rootType;
        let subMap = this.objPairMap.get(key);
        if (subMap === undefined) {
            subMap = new Map();
            this.objPairMap.set(key, subMap);
        }
        let pair = subMap.get(record.id);
        if (pair === undefined) {
            pair = { oldObj: initializeOldObj ? new Map() : undefined };
            subMap.set(record.id, pair);
        }
        return pair;
    }
}
exports.ModificationContext = ModificationContext;
class EntityChangeEventImpl {
    constructor(typeName, id, changedType, changedKeys, oldValueMap, newValueMap) {
        this.typeName = typeName;
        this.id = id;
        this.changedType = changedType;
        this.changedKeys = changedKeys;
    }
    oldValue(changedKey) {
    }
    newValue(kchangedKey) {
    }
}
