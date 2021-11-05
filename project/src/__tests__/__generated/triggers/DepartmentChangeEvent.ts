import {ImplementationType} from '../CommonTypes';
import {DepartmentArgs, DepartmentFlatType} from '../fetchers/DepartmentFetcher';


export interface DepartmentEvictEvent {

    readonly eventType: "evict";

    readonly typeName: ImplementationType<"Department">;

    readonly id: string;

    readonly causedByGC: boolean;

    readonly evictedType: "row" | "fields";

    readonly evictedKeys: ReadonlyArray<DepartmentEntityKey<any>>;

    has(evictedKey: DepartmentEntityKey<any>): boolean;

    evictedValue<TFieldName extends DepartmentEntityFields>(
        key: DepartmentEntityKey<TFieldName>
    ): DepartmentFlatType[TFieldName] | undefined;
}

export interface DepartmentChangeEvent {

    readonly eventType: "change";

    readonly typeName: ImplementationType<"Department">;

    readonly id: string;

    readonly changedType: "insert" | "update" | "delete";

    readonly changedKeys: ReadonlyArray<DepartmentEntityKey<any>>;

    has(changedKey: DepartmentEntityKey<any>): boolean;

    oldValue<TFieldName extends DepartmentEntityFields>(
        key: DepartmentEntityKey<TFieldName>
    ): DepartmentFlatType[TFieldName] | undefined;

    newValue<TFieldName extends DepartmentEntityFields>(
        key: DepartmentEntityKey<TFieldName>
    ): DepartmentFlatType[TFieldName] | undefined;
}

export type DepartmentEntityKey<TFieldName extends DepartmentEntityFields> = 
    TFieldName extends "employees" ? 
    { readonly name: "employees"; readonly variables: DepartmentArgs } : 
    TFieldName
;

export type DepartmentEntityFields = 
    "name" | 
    "employees"
;
