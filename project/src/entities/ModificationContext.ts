import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { EntityChangeEvent, EntityEvictEvent, EntityKey } from "./EntityEvent";
import { Record } from "./Record";
import { VariableArgs } from "./VariableArgs";

export class ModificationContext {

    private objPairMap = new Map<TypeMetadata, Map<any, ObjectPair>>();

    constructor(
        private linkToQuery: (type: TypeMetadata, id: any) => void,
        private publishEvictEvent: (event: EntityEvictEvent) => void,
        private publishChangeEvent: (event: EntityChangeEvent) => void
    ) {}

    close() {
        do {
            const pairMap = this.objPairMap;
            this.objPairMap = new Map<TypeMetadata, Map<any, ObjectPair>>();
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

    insert(record: Record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, false);
            if (pair.newObj === undefined) {
                pair.newObj = new Map<string, any>();
                pair.evicted = false;
            }
        }
    }

    update(record: Record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, true);
            if (pair.newObj === undefined) {
                pair.newObj = new Map<string, any>();
                pair.evicted = false;
            }
        }
    }

    delete(record: Record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, true);
            pair.newObj = undefined;
            pair.evicted = false;
        }
    }

    evict(record: Record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, true);
            pair.newObj = undefined;
            pair.evicted = true;
        }
    }

    set(record: Record, fieldName: string, args: VariableArgs | undefined, oldValue: any, newValue: any) {
        if (fieldName === record.type.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        if (oldValue !== newValue) {
            const pair = this.objPairMap.get(record.type)?.get(record.id);
            if (pair === undefined) {
                throw new Error("Internal bug: the changed record is not cached in ModiciationContext");
            }
            if (pair.oldObj !== undefined && !pair.oldObj.has(fieldName)) {
                pair.oldObj.set(VariableArgs.fieldKey(fieldName, args), oldValue);
            }
            let newObj = pair.newObj;
            if (newObj === undefined) {
                pair.newObj = newObj = new Map<string, any>();
                pair.evicted = false;
            }
            const key = VariableArgs.fieldKey(fieldName, args);
            newObj?.set(key, newValue);
            const evictedFieldKeys = pair.evictedFieldKeys;
            if (evictedFieldKeys !== undefined) {
                evictedFieldKeys.delete(key);
                if (evictedFieldKeys.size === 0) {
                    pair.evictedFieldKeys = undefined;
                }            
            }
        }
    }

    unset(record: Record, fieldName: string, args: VariableArgs | undefined) {
        if (fieldName === record.type.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        const pair = this.pair(record, true);
        const key = VariableArgs.fieldKey(fieldName, args);
        pair.newObj?.delete(key);
        let evictedFieldKeys = pair.evictedFieldKeys;
        if (evictedFieldKeys === undefined) {
            pair.evictedFieldKeys = evictedFieldKeys = new Set<string>();
        }
        evictedFieldKeys.add(key);
    }

    private pair(record: Record, initializeOldObj: boolean): ObjectPair {
        const key = record.type;
        let subMap = this.objPairMap.get(key);
        if (subMap === undefined) {
            subMap = new Map<string, any>();
            this.objPairMap.set(key, subMap);
        }

        let pair = subMap.get(record.id);
        if (pair === undefined) {
            pair = { oldObj: initializeOldObj ? record.createMap(): undefined, evicted: false };
            subMap.set(record.id, pair);
        }
        return pair;
    }

    private publishEvictEvents(type: TypeMetadata, id: any, pair: ObjectPair) {
        if (pair.evictedFieldKeys !== undefined) {
            const map = new Map<string, any>();
            if (pair.oldObj !== undefined) {
                for (const evictedFieldKey of pair.evictedFieldKeys) {
                    if (pair.oldObj.has(evictedFieldKey)) {
                        map.set(evictedFieldKey, pair.oldObj.get(evictedFieldKey));
                    }
                }
            }
            this.publishEvictEvent(
                new EntityEvictEventImpl(
                    type.name,
                    id,
                    "fields",
                    Array.from(map.keys()).map(parseEntityKey),
                    map
                )
            );
        } else {
            const oldObj = pair.oldObj ?? new Map<string, any>();
            this.publishEvictEvent(
                new EntityEvictEventImpl(
                    type.name,
                    id,
                    "row",
                    Array.from(oldObj.keys()).map(parseEntityKey),
                    oldObj
                )
            );
        }
    }

    private publishChangeEvents(type: TypeMetadata, id: any, pair: ObjectPair) {
        const fieldKeys = new Set<string>();
        const oldValueMap = new Map<string, any>();
        const newValueMap = new Map<string, any>();
        if (pair.newObj !== undefined) {
            for (const [fieldKey, newValue] of pair.newObj) {
                if (pair.evictedFieldKeys?.has(fieldKey) !== true) {
                    const oldValue = pair.oldObj?.get(fieldKey);
                    fieldKeys.add(fieldKey);
                    oldValueMap.set(fieldKey, oldValue);
                    newValueMap.set(fieldKey, newValue);
                }
            }
        } else if (pair.oldObj !== undefined) {
            for (const [fieldKey, oldValue] of pair.oldObj) {
                if (pair.evictedFieldKeys?.has(fieldKey) !== true) {
                    fieldKeys.add(fieldKey);
                    oldValueMap.set(fieldKey, oldValue);
                    newValueMap.set(fieldKey, undefined);
                }
            }
        }
        if (pair.newObj === undefined || newValueMap.size !== 0) {
            const event = new EntityChangeEventImpl(
                type.name,
                id,
                pair.oldObj !== undefined && pair.newObj !== undefined ? 
                "update" : (
                    pair.newObj !== undefined ? "insert" : "delete"
                ),
                Array.from(fieldKeys).map(parseEntityKey),
                oldValueMap,
                newValueMap
            );
            this.publishChangeEvent(event);
        }
    }
}

function parseEntityKey(key: string): EntityKey {
    const commaIndex = key.indexOf(':');
    return commaIndex === -1 ? key : {
        name: key.substring(0, commaIndex),
        variables: JSON.parse(key.substring(commaIndex + 1))
    };
}

interface ObjectPair {
    oldObj?: Map<string, any>;
    newObj?: Map<string, any>;
    evicted: boolean;
    evictedFieldKeys?: Set<string>;
}

class EntityEvictEventImpl implements EntityEvictEvent {
    
    readonly eventType: "evict" = "evict";

    constructor(
        readonly typeName: string,
        readonly id: any,
        readonly evictedType: "row" | "fields",
        readonly evictedKeys: ReadonlyArray<EntityKey>,
        private oldValueMap: ReadonlyMap<string, any>
    ) {}

    has(evictedKey: EntityKey): boolean {
        const key = typeof evictedKey === "string" ?
            evictedKey :
            VariableArgs.fieldKey(evictedKey.name, VariableArgs.of(evictedKey.variables));
        return this.oldValueMap.has(key); 
    }

    evictedValue(evictedKey: EntityKey): any {
        const key = typeof evictedKey === "string" ?
            evictedKey :
            VariableArgs.fieldKey(evictedKey.name, VariableArgs.of(evictedKey.variables));
        const value = this.oldValueMap.get(key);
        if (value === undefined && !this.oldValueMap.has(key)) {
            throw new Error(`No evicted key ${key}`);
        }
        return value;
    }
}

class EntityChangeEventImpl implements EntityChangeEvent {

    readonly eventType: "change" = "change";

    constructor(
        readonly typeName: string,
        readonly id: any,
        readonly changedType: "insert" | "update" | "delete",
        readonly changedKeys: ReadonlyArray<
            string | {
                readonly name: string,
                readonly variables: any
            }
        >,
        private oldValueMap: ReadonlyMap<string, any>,
        private newValueMap: ReadonlyMap<string, any>
    ) {
        if (oldValueMap.size !== newValueMap.size) {
            throw new Error("Internal bug: different sizes of oldValueMap and newValueMap");
        }
    }

    has(changedKey: EntityKey): boolean {
        const key = typeof changedKey === "string" ?
            changedKey :
            VariableArgs.fieldKey(changedKey.name, VariableArgs.of(changedKey.variables));
        return this.oldValueMap.has(key);
    }
  
    oldValue(changedKey: EntityKey): any {
        const key = typeof changedKey === 'string' ? 
            changedKey : 
            VariableArgs.fieldKey(changedKey.name, VariableArgs.of(changedKey.variables));
        const oldValue = this.oldValueMap?.get(key);
        if (oldValue === undefined) {
            if (this.oldValueMap === undefined || !this.oldValueMap.has(key)) {
                throw new Error(`Cannot access old value for '${key}'`);
            }
        }
        return oldValue;
    }

    newValue(changedKey: EntityKey): any {
        const key = typeof changedKey === 'string' ? 
            changedKey : 
            VariableArgs.fieldKey(changedKey.name, VariableArgs.of(changedKey.variables));
        const oldValue = this.newValueMap?.get(key);
        if (oldValue === undefined) {
            if (this.newValueMap === undefined || !this.newValueMap.has(key)) {
                throw new Error(`Cannot access new value for '${key}'`);
            }
        }
        return oldValue;
    }
}