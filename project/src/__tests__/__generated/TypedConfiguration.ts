import { Configuration, newConfiguration } from '../..';
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
    DepartmentFlatType,
    EmployeeFlatType
} from './fetchers';
import {
    DepartmentEvictEvent,
    DepartmentChangeEvent,
    EmployeeEvictEvent,
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
            readonly findDepartments: DepartmentFlatType
        };
    };
    readonly entities: {
        readonly "Department": {
            readonly " $id": string;
            readonly " $evictEvent": DepartmentEvictEvent;
            readonly " $changeEvent": DepartmentChangeEvent;
            readonly " $associationTypes": {
                readonly employees: "Employee"
            };
            readonly " $associationArgs": {
                readonly employees: DepartmentArgs["employees"]
            };
            readonly " $associationTargetTypes": {
                readonly employees: EmployeeFlatType
            };
        };
        readonly "Employee": {
            readonly " $id": string;
            readonly " $evictEvent": EmployeeEvictEvent;
            readonly " $changeEvent": EmployeeChangeEvent;
            readonly " $associationTypes": {
                readonly department: "Department"
            };
            readonly " $associationArgs": {
            };
            readonly " $associationTargetTypes": {
                readonly department: DepartmentFlatType
            };
        };
    };
};
