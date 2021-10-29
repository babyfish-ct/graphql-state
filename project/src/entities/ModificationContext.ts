import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { VariableArgs } from "../state/impl/Args";
import { EntityChangeEvent, EntityEvictEvent, EntityKey } from "./EntityEvent";
import { Record } from "./Record";

export class ModificationContext {

    private objPairMap = new Map<TypeMetadata, Map<any, ObjectPair>>();

    constructor(
        private linkToQuery: (type: TypeMetadata, id: any) => void,
        private publishEvictEvent: (event: EntityEvictEvent) => void,
        private publishChangeEvent: (event: EntityChangeEvent) => void,
        private forGC: boolean
    ) {}

    close() {
        let i = 0;
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
                    this.publishEvents(type, id, pair);
                }
            }
        } while (this.objPairMap.size !== 0);
    }

    insert(record: Record) {
        if (this.forGC) {
            throw new Error("Internal bug: insertion is not supported for GC");
        }
        if (record.staticType === record.runtimeType) {
            this.pair(record, false, true);
        }
    }

    delete(record: Record) {
        if (this.forGC) {
            throw new Error("Internal bug: deletion is not supported for GC");
        }
        if (record.staticType === record.runtimeType) {
            const pair = this.pair(record, true, false);
            pair.deleted = true;
        }
    }

    evict(record: Record) {
        if (record.staticType === record.runtimeType) {
            const pair = this.pair(record, true, false);
            pair.deleted = false;
        }
    }

    set(record: Record, fieldName: string, args: VariableArgs | undefined, oldValue: any, newValue: any) {
        if (this.forGC) {
            throw new Error("Internal bug: set is not supported for GC");
        }
        if (fieldName === record.runtimeType.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        if (oldValue !== newValue) {
            const pair = this.pair(record, true, true);
            const key = VariableArgs.fieldKey(fieldName, args);
            pair.oldObj?.set(key, oldValue);
            pair.newObj?.set(key, newValue);
        }
    }

    unset(record: Record, fieldName: string, args: VariableArgs | undefined) {
        if (fieldName === record.runtimeType.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        const pair = this.pair(record, true, true);
        const key = VariableArgs.fieldKey(fieldName, args);
        pair.newObj?.delete(key);
    }

    private pair(record: Record, initializeOldObj: boolean, useNewObj: boolean): ObjectPair {
        const key = record.runtimeType;
        let subMap = this.objPairMap.get(key);
        if (subMap === undefined) {
            subMap = new Map<string, any>();
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
                const map = new Map<string, any>();
                if (pair.oldObj !== undefined) {
                    for (const [k, v] of pair.oldObj) {
                        map.set(k, v);
                    }
                }
                pair.newObj = map;
                pair.deleted = false;
            }
        } else {
            pair.newObj = undefined;
        }
        return pair;
    }

    private publishEvents(type: TypeMetadata, id: any, pair: ObjectPair) {
        if (pair.newObj === undefined) {
            const oldValueMap = new Map<string, any>();
            if (pair.oldObj !== undefined) {
                for (const [key, value] of pair.oldObj) {
                    oldValueMap.set(key, value);
                }
            }
            if (pair.deleted) {
                this.publishChangeEvent(
                    new EntityChangeEventImpl(
                        type.name,
                        id,
                        Array.from(oldValueMap.keys()).map(parseEntityKey),
                        oldValueMap,
                        undefined
                    )
                );
            } else {
                this.publishEvictEvent(
                    new EntityEvictEventImpl(
                        type.name,
                        id,
                        this.forGC,
                        "row",
                        Array.from(oldValueMap.keys()).map(parseEntityKey),
                        oldValueMap
                    )
                );
            }
        } else {
            const evictedValueMap = new Map<string, any>();
            const oldValueMap = new Map<string, any>();
            const newValueMap = new Map<string, any>();
            if (pair.oldObj !== undefined) {
                for (const [k, v] of pair.oldObj) {
                    if (pair.newObj.has(k)) {
                        if (v !== pair.newObj.get(k)) {
                            oldValueMap.set(k, v);
                        }
                    } else {
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
                this.publishEvictEvent(
                    new EntityEvictEventImpl(
                        type.name,
                        id,
                        this.forGC,
                        "fields",
                        Array.from(evictedValueMap.keys()).map(parseEntityKey),
                        evictedValueMap
                    )
                );
            }
            if (oldValueMap.size !== 0 || newValueMap.size !== 0) {
                this.publishChangeEvent(
                    new EntityChangeEventImpl(
                        type.name,
                        id,
                        Array.from((newValueMap ?? oldValueMap).keys()).map(parseEntityKey),
                        oldValueMap.size !== 0 ? oldValueMap : undefined,
                        newValueMap.size !== 0 ? newValueMap : undefined
                    )
                );
            }
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
    deleted: boolean;
}

class EntityEvictEventImpl implements EntityEvictEvent {
    
    readonly eventType: "evict" = "evict";

    constructor(
        readonly typeName: string,
        readonly id: any,
        readonly causedByGC: boolean,
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

    readonly changedType: "insert" | "update" | "delete";

    constructor(
        readonly typeName: string,
        readonly id: any,

        readonly changedKeys: ReadonlyArray<
            string | {
                readonly name: string,
                readonly variables: any
            }
        >,
        private oldValueMap: ReadonlyMap<string, any> | undefined,
        private newValueMap: ReadonlyMap<string, any> | undefined
    ) {
        if (oldValueMap !== undefined && newValueMap !== undefined) {
            if (oldValueMap.size !== newValueMap.size) {
                throw new Error("Internal bug: different sizes of oldValueMap and newValueMap");
            }
            this.changedType = "update";
        } else if (newValueMap === undefined) {
            this.changedType = "delete";
        } else {
            this.changedType = "insert";
        }
    }

    has(changedKey: EntityKey): boolean {
        const key = typeof changedKey === "string" ?
            changedKey :
            VariableArgs.fieldKey(changedKey.name, VariableArgs.of(changedKey.variables));
        return this.oldValueMap?.has(key) === true || this.newValueMap?.has(key) === true;
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