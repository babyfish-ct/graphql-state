import { EntityChangeEvent } from "..";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { Record } from "./Record";
export declare class ModificationContext {
    private linkToQuery;
    private trigger;
    private objPairMap;
    constructor(linkToQuery: (type: TypeMetadata, id: any) => void, trigger: (event: EntityChangeEvent) => void);
    close(): void;
    insert(record: Record): void;
    update(record: Record): void;
    delete(record: Record): void;
    set(record: Record, fieldName: string, variablesCode: string | undefined, oldValue: any, newValue: any): void;
    private pair;
}
export declare function changedKeyString(fieldName: string, variables?: any): string;
