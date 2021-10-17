import { Configuration, newConfiguration } from 'graphql-state';
import {
    department$,
    employee$,
    query$
} from './fetchers';
import {
    DepartmentArgs
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
        readonly " $associationArgs": {
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
        };
        readonly "Employee": {
            readonly " $id": string;
            readonly " $event": EmployeeChangeEvent;
            readonly " $associationTypes": {
                readonly department: "Department"
            };
            readonly " $associationArgs": {
            };
        };
    };
};
