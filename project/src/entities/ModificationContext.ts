import { EntityChangeEvent } from "..";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { EntityChangedKey } from "./EntityChangeEvent";
import { Record } from "./Record";

export class ModificationContext {

    private objPairMap = new Map<TypeMetadata, Map<any, ObjectPair>>();

    fireEvents(trigger: (event: EntityChangeEvent) => void) {
        for (const [type, subMap] of this.objPairMap) {
            for (const [id, objectPair] of subMap) {
                const fieldKeys = new Set<string>();
                const oldValueMap = new Map<string, any>();
                const newValueMap = new Map<string, any>();
                if (objectPair.newObj !== undefined) {
                    for (const [fieldKey, newValue] of objectPair.newObj) {
                        const oldValue = objectPair.oldObj?.get(fieldKey);
                        fieldKeys.add(fieldKey);
                        if (oldValue !== undefined) {
                            oldValueMap.set(fieldKey, oldValue);
                        }
                        if (newValue !== undefined) {
                            newValueMap.set(fieldKey, newValue);
                        }
                    }
                } else if (objectPair.oldObj !== undefined) {
                    for (const [fieldKey, oldValue] of objectPair.oldObj) {
                        fieldKeys.add(fieldKey);
                        if (oldValue !== undefined) {
                            oldValueMap.set(fieldKey, oldValue);
                        }
                    }
                }
                if (objectPair.newObj === undefined || newValueMap.size !== 0) {
                    const event = new EntityChangeEventImpl(
                        type.name,
                        id,
                        objectPair.oldObj !== undefined && objectPair.newObj !== undefined ? 
                        "UPDATE" : (
                            objectPair.newObj !== undefined ? "INSERT" : "DELETE"
                        ),
                        Array.from(fieldKeys).map(parseFieldKey),
                        oldValueMap.size === 0 ? undefined : oldValueMap,
                        newValueMap.size === 0 ? undefined : newValueMap
                    );
                    trigger(event);
                }
            }
        }
    }

    insert(record: Record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, false);
            if (pair.newObj === undefined) {
                pair.newObj = new Map<string, any>();
            }
        }
    }

    update(record: Record) {
        if (record.type.superType === undefined) {
            const pair = this.pair(record, true);
            if (pair.newObj === undefined) {
                pair.newObj = new Map<string, any>();
            }
        }
    }

    delete(record: Record) {
        if (record.type.superType === undefined) {
            this.pair(record, true);
        }
    }

    set(record: Record, fieldName: string, variablesCode: string | undefined, oldValue: any, newValue: any) {
        if (fieldName === record.type.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        if (oldValue !== newValue) {
            const pair = this.objPairMap.get(record.type)?.get(record.id);
            if (pair === undefined) {
                throw new Error("Internal bug: the changed record is not cached in ModiciationContext");
            }
            if (pair.oldObj !== undefined && !pair.oldObj.has(fieldName)) {
                pair.oldObj.set(changedKeyString(fieldName, variablesCode), oldValue);
            }
            pair.newObj?.set(changedKeyString(fieldName, variablesCode), newValue);
        }
    }

    private pair(record: Record, initializeOldObj: boolean) {
        const key = record.type;
        let subMap = this.objPairMap.get(key);
        if (subMap === undefined) {
            subMap = new Map<any, ObjectPair>();
            this.objPairMap.set(key, subMap);
        }

        let pair = subMap.get(record.id);
        if (pair === undefined) {
            pair = { oldObj: initializeOldObj ? new Map<string, any>(): undefined };
            subMap.set(record.id, pair);
        }
        return pair;
    }
}

export function changedKeyString(fieldName: string, variables?: any): string {
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

function parseFieldKey(key: string): EntityChangedKey {
    const commaIndex = key.indexOf(':');
    return commaIndex === -1 ? key : {
        name: key.substring(0, commaIndex),
        variables: JSON.parse(key.substring(commaIndex + 1))
    };
}

interface ObjectPair {
    oldObj?: Map<string, any>;
    newObj?: Map<string, any>;
}

class EntityChangeEventImpl implements EntityChangeEvent {

    constructor(
        readonly typeName: string,
        readonly id: any,
        readonly changedType: "INSERT" | "UPDATE" | "DELETE",
        readonly changedKeys: ReadonlyArray<
            string | {
                readonly name: string,
                readonly variables: any
            }
        >,
        private oldValueMap?: ReadonlyMap<string, any>,
        private newValueMap?: ReadonlyMap<string, any>
    ) {
    }
  
    oldValue(changedKey: EntityChangedKey): any {
        const key = typeof changedKey === 'string' ? 
            changedKey : 
            changedKeyString(changedKey.name, changedKey.variables);
        const oldValue = this.oldValueMap?.get(key);
        if (oldValue === undefined) {
            if (this.oldValueMap === undefined || !this.oldValueMap.has(key)) {
                throw new Error(`Cannot access old value for '${key}'`);
            }
        }
        return oldValue;
    }

    newValue(changedKey: EntityChangedKey): any {
        const key = typeof changedKey === 'string' ? 
            changedKey : 
            changedKeyString(changedKey.name, changedKey.variables);
        const oldValue = this.newValueMap?.get(key);
        if (oldValue === undefined) {
            if (this.newValueMap === undefined || !this.newValueMap.has(key)) {
                throw new Error(`Cannot access new value for '${key}'`);
            }
        }
        return oldValue;
    }
}