import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { VariableArgs } from "../state/impl/Args";
import { EvictLogMessage, EvictReasonType } from "../state/Monitor";
import { EntityChangeEvent, EntityEvictEvent, EntityKey } from "./EntityEvent";
import { Record } from "./Record";

export class ModificationContext {

    private objPairMap = new Map<TypeMetadata, Map<any, ObjectPair>>();

    constructor(
        private versionIncreaser: () => void,
        private publishEvictEvent: (event: EntityEvictEvent) => void,
        private publishChangeEvent: (event: EntityChangeEvent) => void,
        private stateManagerId: string,
        private forGC: boolean
    ) {
        this.versionIncreaser();
    }

    close() {
        while (true) {
            const pairMap = this.objPairMap;
            this.objPairMap = new Map<TypeMetadata, Map<any, ObjectPair>>();
            for (const [type, subMap] of pairMap) {
                for (const [id, pair] of subMap) {
                    this.publishEvents(type, id, pair);
                }
            }
            if (this.objPairMap.size === 0) {
                break;
            }
            this.versionIncreaser();
        }
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
            const map = pair.evictReasonMap;
            if (map !== undefined) {
                map.delete(key);
                if (map.size === 0) {
                    pair.evictReasonMap = undefined;
                }
            }
        }
    }

    unset(record: Record, fieldName: string, args: VariableArgs | undefined, evictReason?: EvictReasonType) {
        if (fieldName === record.runtimeType.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        const pair = this.pair(record, true, true);
        const key = VariableArgs.fieldKey(fieldName, args);
        pair.newObj?.delete(key);
        if (evictReason !== undefined) {
            let map = pair.evictReasonMap;
            if (map === undefined) {
                pair.evictReasonMap = map = new Map<string, EvictReasonType>();
            }
            map.set(key, evictReason);
        }
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
                for (const key of evictedValueMap.keys()) {
                    const evictReason = pair.evictReasonMap?.get(key);
                    if (evictReason !== undefined) {
                        const index = key.indexOf(':');
                        const field = index === -1 ? key : key.substring(0, index);
                        const parameter = index === -1 ? "" : key.substring(index + 1);
                        const message: EvictLogMessage = {
                            messageDomain: "graphQLStateMonitor",
                            messageType: "evictLogCreate",
                            stateManagerId: this.stateManagerId,
                            typeName: type.name,
                            id,
                            field,
                            parameter,
                            targetTypeName: type.fieldMap.get(field)?.targetType?.name,
                            reason: evictReason
                        };
                        postMessage(message, "*");
                    }
                }
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
    evictReasonMap?: Map<string, EvictReasonType>;
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