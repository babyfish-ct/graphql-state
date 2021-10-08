import {ImplementationType} from '../CommonTypes';
import {DepartmentArgs} from '../fetchers/DepartmentFetcher';

export interface DepartmentChangeEvent {

    readonly typeName: ImplementationType<"Department">;

     readonly id: string;

    readonly changedType: "INSERT" | "UPDATE" | "DELETE";

    readonly changedKeys: ReadonlyArray<DepartmentChangeEventKey<any>>;

    oldValue<TFieldName extends DepartmentChangeEventFields>(
        key: DepartmentChangeEventKey<TFieldName>
    ): DepartmentChangeEventValues[TFieldName] | undefined;

    newValue<TFieldName extends DepartmentChangeEventFields>(
        key: DepartmentChangeEventKey<TFieldName>
    ): DepartmentChangeEventValues[TFieldName] | undefined;
}

export type DepartmentChangeEventKey<TFieldName extends DepartmentChangeEventFields> = 
    TFieldName extends "employees" ? 
    { readonly name: "employees"; readonly variables: DepartmentArgs } : 
    TFieldName
;

export type DepartmentChangeEventFields = 
    "name" | 
    "employees"
;

export interface DepartmentChangeEventValues {
    readonly name: string;
    readonly employees: readonly {
        readonly id: string
    }[];
};
