import {ImplementationType} from '../CommonTypes';
import {EmployeeFlatType} from '../fetchers/EmployeeFetcher';

export interface EmployeeChangeEvent {

    readonly typeName: ImplementationType<"Employee">;

     readonly id: string;

    readonly changedType: "INSERT" | "UPDATE" | "DELETE";

    readonly changedKeys: ReadonlyArray<EmployeeChangeEventKey<any>>;

    oldValue<TFieldName extends EmployeeChangeEventFields>(
        key: EmployeeChangeEventKey<TFieldName>
    ): EmployeeFlatType[TFieldName] | undefined;

    newValue<TFieldName extends EmployeeChangeEventFields>(
        key: EmployeeChangeEventKey<TFieldName>
    ): EmployeeFlatType[TFieldName] | undefined;
}

export type EmployeeChangeEventKey<TFieldName extends EmployeeChangeEventFields> = 
    TFieldName
;

export type EmployeeChangeEventFields = 
    "name" | 
    "department"
;
