import { newConfiguration } from '../..';
import { department$ } from './fetchers';
import { DepartmentChangeEvent } from './triggers';
import { employee$ } from './fetchers';
import { EmployeeChangeEvent } from './triggers';
import { query$ } from './fetchers';

export function newTypedConfiguration() {
    return newConfiguration()
        
    ;
}
export type Schema = {
    readonly "Department": {
        readonly " $id": string;
        readonly " $event": DepartmentChangeEvent
    };
    readonly "Employee": {
        readonly " $id": string;
        readonly " $event": EmployeeChangeEvent
    };
}
