import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { VariableArgs } from "../state/impl/Args";
import { EntityChangeEvent, EntityEvictEvent } from "./EntityEvent";
import { Record } from "./Record";
export declare class ModificationContext {
    private linkToQuery;
    private publishEvictEvent;
    private publishChangeEvent;
    private objPairMap;
    constructor(linkToQuery: (type: TypeMetadata, id: any) => void, publishEvictEvent: (event: EntityEvictEvent) => void, publishChangeEvent: (event: EntityChangeEvent) => void);
    close(): void;
    insert(record: Record): void;
    delete(record: Record): void;
    evict(record: Record): void;
    set(record: Record, fieldName: string, args: VariableArgs | undefined, oldValue: any, newValue: any): void;
    unset(record: Record, fieldName: string, args: VariableArgs | undefined): void;
    private pair;
    private publishEvents;
}
