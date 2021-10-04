import {ImplementationType} from '../CommonTypes';

export interface DepartmentChangeEvent {

    readonly typeName: ImplementationType<"Department">;

     readonly id: string;

    readonly changedType: "INSERT" | "UPDATE" | "DELETE";

    readonly changedKeys: ReadonlyArray<DepartmentChangeEventKey>;

    oldValue<TKey extends DepartmentChangeEventSimpleKeys>(
        key: TKey
    ): DepartmentChangeEventValues[TKey] | undefined;

    newValue<TKey extends DepartmentChangeEventSimpleKeys>(
        key: TKey
    ): DepartmentChangeEventValues[TKey] | undefined;
}

export type DepartmentChangeEventKey = 
    DepartmentChangeEventSimpleKeys
;

export type DepartmentChangeEventSimpleKeys = 
    "name" | 
    "employees"
;

export interface DepartmentChangeEventValues {
    name: string;
    employees: readonly {readonly id: any}[];
};
