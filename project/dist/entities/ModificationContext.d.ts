import { EntityChangeEvent } from "..";
import { Record } from "./Record";
export declare class ModificationContext {
    private objPairMap;
    fireEvents(trigger: (event: EntityChangeEvent) => void): void;
    insert(record: Record): void;
    update(record: Record): void;
    delete(record: Record): void;
    set(record: Record, fieldName: string, variablesCode: string | undefined, oldValue: any, newValue: any): void;
    private pair;
}
export declare function changedKeyString(fieldName: string, variables?: any): string;
