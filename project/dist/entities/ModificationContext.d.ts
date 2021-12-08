import { VariableArgs } from "../state/impl/Args";
import { RefetchReasonType } from "../state/Monitor";
import { EntityChangeEvent, EntityEvictEvent } from "./EntityEvent";
import { Record } from "./Record";
export declare class ModificationContext {
    private versionIncreaser;
    private publishEvictEvent;
    private publishChangeEvent;
    private stateManagerId;
    private forGC;
    private objPairMap;
    constructor(versionIncreaser: () => void, publishEvictEvent: (event: EntityEvictEvent) => void, publishChangeEvent: (event: EntityChangeEvent) => void, stateManagerId: string, forGC: boolean);
    close(): void;
    insert(record: Record): void;
    delete(record: Record): void;
    evict(record: Record): void;
    set(record: Record, fieldName: string, args: VariableArgs | undefined, oldValue: any, newValue: any): void;
    unset(record: Record, fieldName: string, args: VariableArgs | undefined, refetchReason?: RefetchReasonType): void;
    private pair;
    private publishEvents;
}
