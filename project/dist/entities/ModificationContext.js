"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModificationContext = void 0;
const VariableArgs_1 = require("./VariableArgs");
class ModificationContext {
    constructor(linkToQuery, publishEvictEvent, publishChangeEvent) {
        this.linkToQuery = linkToQuery;
        this.publishEvictEvent = publishEvictEvent;
        this.publishChangeEvent = publishChangeEvent;
        this.objPairMap = new Map();
    }
    close() {
        do {
            const pairMap = this.objPairMap;
            this.objPairMap = new Map();
            for (const [type, subMap] of pairMap) {
                for (const [id, pair] of subMap) {
                    if (pair.oldObj === undefined && pair.newObj !== undefined) {
                        this.linkToQuery(type, id);
                    }
                }
            }
            for (const [type, subMap] of pairMap) {
                for (const [id, pair] of subMap) {
                    if (pair.evicted || pair.evictedFieldKeys !== undefined) {
                        this.publishEvictEvents(type, id, pair);
                    }
                    if (!pair.evicted) {
                        this.publishChangeEvents(type, id, pair);
                    }
                }
            }
        } while (this.objPairMap.size !== 0);
    }
    insert(record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, false);
            if (pair.newObj === undefined) {
                pair.newObj = new Map();
                pair.evicted = false;
            }
        }
    }
    update(record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, true);
            if (pair.newObj === undefined) {
                pair.newObj = new Map();
                pair.evicted = false;
            }
        }
    }
    delete(record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, true);
            pair.newObj = undefined;
            pair.evicted = false;
        }
    }
    evict(record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, true);
            pair.newObj = undefined;
            pair.evicted = true;
        }
    }
    set(record, fieldName, args, oldValue, newValue) {
        var _a;
        if (fieldName === record.type.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        if (oldValue !== newValue) {
            const pair = (_a = this.objPairMap.get(record.type)) === null || _a === void 0 ? void 0 : _a.get(record.id);
            if (pair === undefined) {
                throw new Error("Internal bug: the changed record is not cached in ModiciationContext");
            }
            if (pair.oldObj !== undefined && !pair.oldObj.has(fieldName)) {
                pair.oldObj.set(VariableArgs_1.VariableArgs.fieldKey(fieldName, args), oldValue);
            }
            let newObj = pair.newObj;
            if (newObj === undefined) {
                pair.newObj = newObj = new Map();
                pair.evicted = false;
            }
            const key = VariableArgs_1.VariableArgs.fieldKey(fieldName, args);
            newObj === null || newObj === void 0 ? void 0 : newObj.set(key, newValue);
            const evictedFieldKeys = pair.evictedFieldKeys;
            if (evictedFieldKeys !== undefined) {
                evictedFieldKeys.delete(key);
                if (evictedFieldKeys.size === 0) {
                    pair.evictedFieldKeys = undefined;
                }
            }
        }
    }
    unset(record, fieldName, args) {
        var _a;
        if (fieldName === record.type.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        const pair = this.pair(record, true);
        const key = VariableArgs_1.VariableArgs.fieldKey(fieldName, args);
        (_a = pair.newObj) === null || _a === void 0 ? void 0 : _a.delete(key);
        let evictedFieldKeys = pair.evictedFieldKeys;
        if (evictedFieldKeys === undefined) {
            pair.evictedFieldKeys = evictedFieldKeys = new Set();
        }
        evictedFieldKeys.add(key);
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
            pair = { oldObj: initializeOldObj ? record.createMap() : undefined, evicted: false };
            subMap.set(record.id, pair);
        }
        return pair;
    }
    publishEvictEvents(type, id, pair) {
        var _a;
        if (pair.evictedFieldKeys !== undefined) {
            const map = new Map();
            if (pair.oldObj !== undefined) {
                for (const evictedFieldKey of pair.evictedFieldKeys) {
                    if (pair.oldObj.has(evictedFieldKey)) {
                        map.set(evictedFieldKey, pair.oldObj.get(evictedFieldKey));
                    }
                }
            }
            this.publishEvictEvent(new EntityEvictEventImpl(type.name, id, "fields", Array.from(map.keys()).map(parseEntityKey), map));
        }
        else {
            const oldObj = (_a = pair.oldObj) !== null && _a !== void 0 ? _a : new Map();
            this.publishEvictEvent(new EntityEvictEventImpl(type.name, id, "row", Array.from(oldObj.keys()).map(parseEntityKey), oldObj));
        }
    }
    publishChangeEvents(type, id, pair) {
        var _a, _b, _c;
        const fieldKeys = new Set();
        const oldValueMap = new Map();
        const newValueMap = new Map();
        if (pair.newObj !== undefined) {
            for (const [fieldKey, newValue] of pair.newObj) {
                if (((_a = pair.evictedFieldKeys) === null || _a === void 0 ? void 0 : _a.has(fieldKey)) !== true) {
                    const oldValue = (_b = pair.oldObj) === null || _b === void 0 ? void 0 : _b.get(fieldKey);
                    fieldKeys.add(fieldKey);
                    oldValueMap.set(fieldKey, oldValue);
                    newValueMap.set(fieldKey, newValue);
                }
            }
        }
        else if (pair.oldObj !== undefined) {
            for (const [fieldKey, oldValue] of pair.oldObj) {
                if (((_c = pair.evictedFieldKeys) === null || _c === void 0 ? void 0 : _c.has(fieldKey)) !== true) {
                    fieldKeys.add(fieldKey);
                    oldValueMap.set(fieldKey, oldValue);
                    newValueMap.set(fieldKey, undefined);
                }
            }
        }
        if (pair.newObj === undefined || newValueMap.size !== 0) {
            const event = new EntityChangeEventImpl(type.name, id, pair.oldObj !== undefined && pair.newObj !== undefined ?
                "update" : (pair.newObj !== undefined ? "insert" : "delete"), Array.from(fieldKeys).map(parseEntityKey), oldValueMap, newValueMap);
            this.publishChangeEvent(event);
        }
    }
}
exports.ModificationContext = ModificationContext;
function parseEntityKey(key) {
    const commaIndex = key.indexOf(':');
    return commaIndex === -1 ? key : {
        name: key.substring(0, commaIndex),
        variables: JSON.parse(key.substring(commaIndex + 1))
    };
}
class EntityEvictEventImpl {
    constructor(typeName, id, evictedType, evictedKeys, oldValueMap) {
        this.typeName = typeName;
        this.id = id;
        this.evictedType = evictedType;
        this.evictedKeys = evictedKeys;
        this.oldValueMap = oldValueMap;
    }
    has(evictedKey) {
        const key = typeof evictedKey === "string" ?
            evictedKey :
            VariableArgs_1.VariableArgs.fieldKey(evictedKey.name, VariableArgs_1.VariableArgs.of(evictedKey.variables));
        return this.oldValueMap.has(key);
    }
    evictedValue(evictedKey) {
        const key = typeof evictedKey === "string" ?
            evictedKey :
            VariableArgs_1.VariableArgs.fieldKey(evictedKey.name, VariableArgs_1.VariableArgs.of(evictedKey.variables));
        const value = this.oldValueMap.get(key);
        if (value === undefined && !this.oldValueMap.has(key)) {
            throw new Error(`No evicted key ${key}`);
        }
        return value;
    }
}
class EntityChangeEventImpl {
    constructor(typeName, id, changedType, changedKeys, oldValueMap, newValueMap) {
        this.typeName = typeName;
        this.id = id;
        this.changedType = changedType;
        this.changedKeys = changedKeys;
        this.oldValueMap = oldValueMap;
        this.newValueMap = newValueMap;
        if (oldValueMap.size !== newValueMap.size) {
            throw new Error("Internal bug: different sizes of oldValueMap and newValueMap");
        }
    }
    has(changedKey) {
        const key = typeof changedKey === "string" ?
            changedKey :
            VariableArgs_1.VariableArgs.fieldKey(changedKey.name, VariableArgs_1.VariableArgs.of(changedKey.variables));
        return this.oldValueMap.has(key);
    }
    oldValue(changedKey) {
        var _a;
        const key = typeof changedKey === 'string' ?
            changedKey :
            VariableArgs_1.VariableArgs.fieldKey(changedKey.name, VariableArgs_1.VariableArgs.of(changedKey.variables));
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
            VariableArgs_1.VariableArgs.fieldKey(changedKey.name, VariableArgs_1.VariableArgs.of(changedKey.variables));
        const oldValue = (_a = this.newValueMap) === null || _a === void 0 ? void 0 : _a.get(key);
        if (oldValue === undefined) {
            if (this.newValueMap === undefined || !this.newValueMap.has(key)) {
                throw new Error(`Cannot access new value for '${key}'`);
            }
        }
        return oldValue;
    }
}
