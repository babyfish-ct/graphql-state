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
                const fieldKeys = new Set();
                const oldValueMap = new Map();
                const newValueMap = new Map();
                if (objectPair.newObj !== undefined) {
                    for (const [fieldKey, newValue] of objectPair.newObj) {
                        const oldValue = (_a = objectPair.oldObj) === null || _a === void 0 ? void 0 : _a.get(fieldKey);
                        fieldKeys.add(fieldKey);
                        if (oldValue !== undefined) {
                            oldValueMap.set(fieldKey, oldValue);
                        }
                        if (newValue !== undefined) {
                            newValueMap.set(fieldKey, newValue);
                        }
                    }
                }
                else if (objectPair.oldObj !== undefined) {
                    for (const [fieldKey, oldValue] of objectPair.oldObj) {
                        fieldKeys.add(fieldKey);
                        if (oldValue !== undefined) {
                            oldValueMap.set(fieldKey, oldValue);
                        }
                    }
                }
                if (oldValueMap.size !== 0 || newValueMap.size !== 0) {
                    const event = new EntityChangeEventImpl(type.name, id, objectPair.oldObj !== undefined && objectPair.newObj !== undefined ?
                        "UPDATE" : (objectPair.newObj !== undefined ? "INSERT" : "DELETE"), Array.from(fieldKeys).map(parseFieldKey), oldValueMap.size === 0 ? undefined : oldValueMap, newValueMap.size === 0 ? undefined : newValueMap);
                    trigger(event);
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
    change(record, fieldName, variablesCode, oldValue, newValue) {
        var _a, _b;
        if (fieldName === record.type.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        if (oldValue !== newValue) {
            const pair = (_a = this.objPairMap.get(record.type)) === null || _a === void 0 ? void 0 : _a.get(record.id);
            if (pair === undefined) {
                throw new Error("Internal bug: the changed record is not cached in ModiciationContext");
            }
            if (pair.oldObj !== undefined && !pair.oldObj.has(fieldName)) {
                pair.oldObj.set(changedKeyString(fieldName, variablesCode), oldValue);
            }
            (_b = pair.newObj) === null || _b === void 0 ? void 0 : _b.set(changedKeyString(fieldName, variablesCode), newValue);
        }
    }
    pair(record, initializeOldObj) {
        const key = record.type;
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
function changedKeyString(fieldName, variables) {
    const vsCode = typeof variables === 'object' ?
        JSON.stringify(variables) :
        typeof variables === 'string' ?
            variables :
            undefined;
    if (vsCode === undefined || vsCode === '{}') {
        return fieldName;
    }
    return `${fieldName}:${vsCode}`;
}
function parseFieldKey(key) {
    const commaIndex = key.indexOf(':');
    return commaIndex === -1 ? key : {
        name: key.substring(0, commaIndex),
        variables: JSON.parse(key.substring(commaIndex + 1))
    };
}
class EntityChangeEventImpl {
    constructor(typeName, id, changedType, changedKeys, oldValueMap, newValueMap) {
        this.typeName = typeName;
        this.id = id;
        this.changedType = changedType;
        this.changedKeys = changedKeys;
        this.oldValueMap = oldValueMap;
        this.newValueMap = newValueMap;
    }
    oldValue(changedKey) {
        var _a;
        const key = typeof changedKey === 'string' ?
            changedKey :
            changedKeyString(changedKey.name, changedKey.variables);
        const oldValue = (_a = this.oldValueMap) === null || _a === void 0 ? void 0 : _a.get(key);
        if (oldValue === undefined) {
            if (this.oldValueMap === undefined || !this.oldValueMap.has(key)) {
                throw new Error(`Cannot access old value for '${key}'`);
            }
        }
        return oldValue;
    }
    newValue(changedKey) {
        var _a;
        const key = typeof changedKey === 'string' ?
            changedKey :
            changedKeyString(changedKey.name, changedKey.variables);
        const oldValue = (_a = this.newValueMap) === null || _a === void 0 ? void 0 : _a.get(key);
        if (oldValue === undefined) {
            if (this.newValueMap === undefined || !this.newValueMap.has(key)) {
                throw new Error(`Cannot access new value for '${key}'`);
            }
        }
        return oldValue;
    }
}
