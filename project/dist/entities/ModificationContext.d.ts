import { EntityChangedEvent } from "../state/ChangedEntity";
import { Record } from "./Record";
export declare class ModificationContext {
    private objPairMap;
    fireEvents(trigger: (event: EntityChangedEvent<any>) => void): void;
    insert(record: Record): void;
    update(record: Record): void;
    delete(record: Record): void;
    change(record: Record, fieldName: string, oldValue: any, newValue: any): void;
    private pair;
}
