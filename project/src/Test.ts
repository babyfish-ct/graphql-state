import { Configuration, typeRefBuilder } from "./meta/Configuration";
import { SchemaOf } from "./meta/SchemaTypes";
import { makeManagedObjectHooks } from "./state/StateHook";

interface State {
    departments(name?: string): Department[];
}

interface Department {
    readonly __typename: "Department",
    readonly id: string,
    readonly name: string,
    readonly employees: readonly Employee[];
}

interface Employee {
    readonly __typename: "Employee",
    readonly id: string,
    readonly name: string,
    readonly department: string[];
}

function configuation(): Configuration<{objectTypes: {}, collectionTypes: {}, edgeTypes: {}}> {
    throw new Error("");
}

const cfg = configuation()
.declareObjectType(typeRefBuilder<Department>().named("Department"))
.declareObjectType(typeRefBuilder<Employee>().named("Employee"))
.implementType("Department", tc => {
    tc
    .list("employees", "Employee", { mappedBy: "department" })
})
.implementType("Employee", tc => {
    tc
    .reference("department", "Department", { deleteOperation: "CASCADE" })
});

const { useManagedObject, useManagedObjects } = makeManagedObjectHooks<SchemaOf<typeof cfg>>();
export { useManagedObject, useManagedObjects };

const deparmtents: Department[] = [];
