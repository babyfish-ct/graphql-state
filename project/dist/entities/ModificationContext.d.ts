import { VariableArgs } from "../state/impl/Args";
import { EntityChangeEvent, EntityEvictEvent } from "./EntityEvent";
import { Record } from "./Record";
export declare class ModificationContext {
    private versionIncreaser;
    private publishEvictEvent;
    private publishChangeEvent;
    private forGC;
    private objPairMap;
    constructor(versionIncreaser: () => void, publishEvictEvent: (event: EntityEvictEvent) => void, publishChangeEvent: (event: EntityChangeEvent) => void, forGC: boolean);
    close(): void;
    insert(record: Record): void;
    delete(record: Record): void;
    evict(record: Record): void;
    set(record: Record, fieldName: string, args: VariableArgs | undefined, oldValue: any, newValue: any): void;
    unset(record: Record, fieldName: string, args: VariableArgs | undefined): void;
    private pair;
    private publishEvents;
}
