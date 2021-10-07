import { Configuration, newConfiguration } from '../..';
import { department$ } from './fetchers';
import { DepartmentChangeEvent } from './triggers';
import { employee$ } from './fetchers';
import { EmployeeChangeEvent } from './triggers';
import { query$ } from './fetchers';

export function newTypedConfiguration(): Configuration<Schema> {
    return newConfiguration<Schema>(
        department$, 
        employee$, 
        query$
    );
}

export type Schema = {
    readonly "Department": {
        readonly " $id": string;
        readonly " $event": DepartmentChangeEvent;
        readonly " $associations": {readonly employees: "Employee"};
    };
    readonly "Employee": {
        readonly " $id": string;
        readonly " $event": EmployeeChangeEvent;
        readonly " $associations": {readonly department: "Department"};
    };
}
