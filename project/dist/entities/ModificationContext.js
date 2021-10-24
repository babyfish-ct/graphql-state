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
                    this.publishEvents(type, id, pair);
                }
            }
        } while (this.objPairMap.size !== 0);
    }
    insert(record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, false, true);
        }
    }
    delete(record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, true, false);
            pair.deleted = true;
        }
    }
    evict(record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, true, false);
            pair.deleted = false;
        }
    }
    set(record, fieldName, args, oldValue, newValue) {
        var _a, _b;
        if (fieldName === record.type.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        if (oldValue !== newValue) {
            const pair = this.pair(record, true, true);
            const key = VariableArgs_1.VariableArgs.fieldKey(fieldName, args);
            (_a = pair.oldObj) === null || _a === void 0 ? void 0 : _a.set(key, oldValue);
            (_b = pair.newObj) === null || _b === void 0 ? void 0 : _b.set(key, newValue);
        }
    }
    unset(record, fieldName, args) {
        var _a;
        if (fieldName === record.type.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        const pair = this.pair(record, true, true);
        const key = VariableArgs_1.VariableArgs.fieldKey(fieldName, args);
        (_a = pair.newObj) === null || _a === void 0 ? void 0 : _a.delete(key);
    }
    pair(record, initializeOldObj, useNewObj) {
        const key = record.type;
        let subMap = this.objPairMap.get(key);
        if (subMap === undefined) {
            subMap = new Map();
            this.objPairMap.set(key, subMap);
        }
        let pair = subMap.get(record.id);
        if (pair === undefined) {
            const map = record.createMap();
            pair = {
                oldObj: initializeOldObj ? map : undefined,
                deleted: false
            };
            subMap.set(record.id, pair);
        }
        if (useNewObj) {
            if (pair.newObj === undefined) {
                const map = new Map();
                if (pair.oldObj !== undefined) {
                    for (const [k, v] of pair.oldObj) {
                        map.set(k, v);
                    }
                }
                pair.newObj = map;
                pair.deleted = false;
            }
        }
        else {
            pair.newObj = undefined;
        }
        return pair;
    }
    publishEvents(type, id, pair) {
        if (pair.newObj === undefined) {
            const oldValueMap = new Map();
            if (pair.oldObj !== undefined) {
                for (const [key, value] of pair.oldObj) {
                    oldValueMap.set(key, value);
                }
            }
            if (pair.deleted) {
                this.publishChangeEvent(new EntityChangeEventImpl(type.name, id, Array.from(oldValueMap.keys()).map(parseEntityKey), oldValueMap, undefined));
            }
            else {
                this.publishEvictEvent(new EntityEvictEventImpl(type.name, id, "row", Array.from(oldValueMap.keys()).map(parseEntityKey), oldValueMap));
            }
        }
        else {
            const evictedValueMap = new Map();
            const oldValueMap = new Map();
            const newValueMap = new Map();
            if (pair.oldObj !== undefined) {
                for (const [k, v] of pair.oldObj) {
                    if (pair.newObj.has(k)) {
                        if (v !== pair.newObj.get(k)) {
                            oldValueMap.set(k, v);
                        }
                    }
                    else {
                        evictedValueMap.set(k, v);
                    }
                }
            }
            for (const [k, v] of pair.newObj) {
                if (pair.oldObj === undefined || oldValueMap.has(k)) {
                    newValueMap.set(k, v);
                }
            }
            if (evictedValueMap.size !== 0) {
                this.publishEvictEvent(new EntityEvictEventImpl(type.name, id, "fields", Array.from(evictedValueMap.keys()).map(parseEntityKey), evictedValueMap));
            }
            if (oldValueMap.size !== 0 || newValueMap.size !== 0) {
                this.publishChangeEvent(new EntityChangeEventImpl(type.name, id, Array.from((newValueMap !== null && newValueMap !== void 0 ? newValueMap : oldValueMap).keys()).map(parseEntityKey), oldValueMap.size !== 0 ? oldValueMap : undefined, newValueMap.size !== 0 ? newValueMap : undefined));
            }
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
        this.eventType = "evict";
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
    constructor(typeName, id, changedKeys, oldValueMap, newValueMap) {
        this.typeName = typeName;
        this.id = id;
        this.changedKeys = changedKeys;
        this.oldValueMap = oldValueMap;
        this.newValueMap = newValueMap;
        this.eventType = "change";
        if (oldValueMap !== undefined && newValueMap !== undefined) {
            if (oldValueMap.size !== newValueMap.size) {
                throw new Error("Internal bug: different sizes of oldValueMap and newValueMap");
            }
            this.changedType = "update";
        }
        else if (newValueMap === undefined) {
            this.changedType = "delete";
        }
        else {
            this.changedType = "insert";
        }
    }
    has(changedKey) {
        var _a, _b;
        const key = typeof changedKey === "string" ?
            changedKey :
            VariableArgs_1.VariableArgs.fieldKey(changedKey.name, VariableArgs_1.VariableArgs.of(changedKey.variables));
        return ((_a = this.oldValueMap) === null || _a === void 0 ? void 0 : _a.has(key)) === true || ((_b = this.newValueMap) === null || _b === void 0 ? void 0 : _b.has(key)) === true;
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
