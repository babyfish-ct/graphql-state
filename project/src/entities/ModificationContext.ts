import { EntityChangeEvent } from "..";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { Record } from "./Record";

export class ModificationContext {

    private objPairMap = new Map<TypeMetadata, Map<any, ObjectPair>>();

    fireEvents(trigger: (event: EntityChangeEvent) => void) {
        for (const [type, subMap] of this.objPairMap) {
            for (const [id, objectPair] of subMap) {
                const fieldNames = new Set<string>();
                const oldValueMap = new Map<string, any>();
                const newValueMap = new Map<string, any>();
                if (objectPair.newObj !== undefined) {
                    for (const [fieldName, newValue] of objectPair.newObj) {
                        const oldValue = objectPair.oldObj?.get(fieldName);
                        fieldNames.add(fieldName);
                        if (oldValue !== undefined) {
                            oldValueMap.set(fieldName, oldValue);
                        }
                        if (newValue !== undefined) {
                            newValueMap.set(fieldName, newValue);
                        }
                    }
                } else if (objectPair.oldObj !== undefined) {
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
            const pair = this.pair(record, true);
            if (pair.oldObj === undefined) {
                pair.oldObj = new Map<string, any>();
            }
        }
    }

    change(record: Record, fieldName: string, oldValue: any, newValue: any) {
        if (fieldName === record.type.idField.name) {
            throw new Error("Internal bug: the changed name cannot be id");
        }
        if (oldValue !== newValue) {
            const pair = this.objPairMap.get(record.type.rootType)?.get(record.id);
            if (pair === undefined) {
                throw new Error("Internal bug: the changed record is not cached in ModiciationContext");
            }
            if (pair.oldObj !== undefined && !pair.oldObj.has(fieldName)) {
                pair.oldObj.set(fieldName, oldValue);
            }
            pair.newObj?.set(fieldName, newValue);
        }
    }

    private pair(record: Record, initializeOldObj: boolean) {
        
        const key = record.type.rootType;
        
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
        oldValueMap: ReadonlyMap<string, any>,
        newValueMap: ReadonlyMap<string, any>
    ) {
    }
  
    oldValue(key: string, variables?: any): any {

    }

    newValue(key: string, variables?: any): any {

    }
}