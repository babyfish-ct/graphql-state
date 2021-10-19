import { Configuration, newConfiguration } from 'graphql-state';
import {
    department$,
    employee$,
    query$
} from './fetchers';
import {
    DepartmentArgs,
    QueryArgs
} from './fetchers';
import {
    DepartmentScalarType,
    EmployeeScalarType
} from './fetchers';
import {
    DepartmentChangeEvent,
    EmployeeChangeEvent
} from './triggers';

export function newTypedConfiguration(): Configuration<Schema> {
    return newConfiguration<Schema>(
        department$, 
        employee$, 
        query$
    );
}

export type Schema = {
    readonly query: {
        readonly " $associationTypes": {
            readonly findDepartments: "Department"
        };
        readonly " $associationArgs": {
            readonly findDepartments: QueryArgs["findDepartments"]
        };
        readonly " $associationTargetTypes": {
            readonly findDepartments: DepartmentScalarType
        };
    };
    readonly entities: {
        readonly "Department": {
            readonly " $id": string;
            readonly " $event": DepartmentChangeEvent;
            readonly " $associationTypes": {
                readonly employees: "Employee"
            };
            readonly " $associationArgs": {
                readonly employees: DepartmentArgs["employees"]
            };
            readonly " $associationTargetTypes": {
                readonly employees: EmployeeScalarType
            };
        };
        readonly "Employee": {
            readonly " $id": string;
            readonly " $event": EmployeeChangeEvent;
            readonly " $associationTypes": {
                readonly department: "Department"
            };
            readonly " $associationArgs": {
            };
            readonly " $associationTargetTypes": {
                readonly department: DepartmentScalarType
            };
        };
    };
};
