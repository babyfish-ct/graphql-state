import {ImplementationType} from '../CommonTypes';

export interface EmployeeChangeEvent {

    readonly typeName: ImplementationType<"Employee">;

     readonly id: string;

    readonly changedType: "INSERT" | "UPDATE" | "DELETE";

    readonly changedKeys: ReadonlyArray<EmployeeChangeEventKey>;

    oldValue<TKey extends EmployeeChangeEventSimpleKeys>(
        key: TKey
    ): EmployeeChangeEventValues[TKey] | undefined;

    newValue<TKey extends EmployeeChangeEventSimpleKeys>(
        key: TKey
    ): EmployeeChangeEventValues[TKey] | undefined;
}

export type EmployeeChangeEventKey = 
    EmployeeChangeEventSimpleKeys
;

export type EmployeeChangeEventSimpleKeys = 
    "name" | 
    "department"
;

export interface EmployeeChangeEventValues {
    name: string;
    department: {readonly id: any};
};
