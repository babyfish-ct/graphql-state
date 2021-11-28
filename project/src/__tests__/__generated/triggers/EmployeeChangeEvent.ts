import {ImplementationType} from '../CommonTypes';
import {EmployeeFlatType} from '../fetchers/EmployeeFetcher';


export interface EmployeeEvictEvent {

    readonly eventType: "evict";

    readonly typeName: ImplementationType<"Employee">;

    readonly id: string;

    readonly causedByGC: boolean;

    readonly evictedType: "row" | "fields";

    readonly evictedKeys: ReadonlyArray<EmployeeEntityKey<any>>;

    has(evictedKey: EmployeeEntityKey<any>): boolean;

    evictedValue<TFieldName extends EmployeeEntityFields>(
        key: EmployeeEntityKey<TFieldName>
    ): EmployeeFlatType[TFieldName] | undefined;
}

export interface EmployeeChangeEvent {

    readonly eventType: "change";

    readonly typeName: ImplementationType<"Employee">;

    readonly id: string;

    readonly changedType: "insert" | "update" | "delete";

    readonly changedKeys: ReadonlyArray<EmployeeEntityKey<any>>;

    has(changedKey: EmployeeEntityKey<any>): boolean;

    oldValue<TFieldName extends EmployeeEntityFields>(
        key: EmployeeEntityKey<TFieldName>
    ): EmployeeFlatType[TFieldName] | undefined;

    newValue<TFieldName extends EmployeeEntityFields>(
        key: EmployeeEntityKey<TFieldName>
    ): EmployeeFlatType[TFieldName] | undefined;
}

export type EmployeeEntityKey<TFieldName extends EmployeeEntityFields> = 
    TFieldName
;

export type EmployeeEntityFields = 
    "name" | 
    "department"
;
