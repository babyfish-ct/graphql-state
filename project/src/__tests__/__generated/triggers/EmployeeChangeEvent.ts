import {ImplementationType} from '../CommonTypes';

export interface EmployeeChangeEvent {

    readonly typeName: ImplementationType<"Employee">;

     readonly id: string;

    readonly changedType: "INSERT" | "UPDATE" | "DELETE";

    readonly changedKeys: ReadonlyArray<EmployeeChangeEventKey<any>>;

    oldValue<TFieldName extends EmployeeChangeEventFields>(
        key: EmployeeChangeEventKey<TFieldName>
    ): EmployeeChangeEventValues[TFieldName] | undefined;

    newValue<TFieldName extends EmployeeChangeEventFields>(
        key: EmployeeChangeEventKey<TFieldName>
    ): EmployeeChangeEventValues[TFieldName] | undefined;
}

export type EmployeeChangeEventKey<TFieldName extends EmployeeChangeEventFields> = 
    TFieldName
;

export type EmployeeChangeEventFields = 
    "name" | 
    "department"
;

export interface EmployeeChangeEventValues {
    readonly name: string;
    readonly department: {
        readonly id: string
    };
};
