import { Configuration, typeRefBuilder } from "./meta/Configuration";
import { SchemaOf } from "./meta/SchemaTypes";
import { variables } from "./meta/Shape";
import { makeComputedStateCreators } from "./state/State";
import { makeManagedObjectHooks } from "./state/StateHook";

interface State {
    departments(name?: string): Department[];
}

interface Department {
    readonly __typename: "Department",
    readonly id: string,
    readonly name: string,
    readonly location: string,
    readonly employees: readonly Employee[];
}

interface Employee {
    readonly __typename: "Employee",
    readonly id: string,
    readonly firstName: string,
    readonly lastName: string,
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


const { createComputedState, createAsyncState } = makeComputedStateCreators<SchemaOf<typeof cfg>>();
export { createComputedState, createAsyncState };

const { useManagedObject, useManagedObjects } = makeManagedObjectHooks<SchemaOf<typeof cfg>>();
export { useManagedObject, useManagedObjects };

const deparmtents: Department[] = [];

useManagedObjects("Department", {
    ids: ["abc"],
    shape: {
        id: true,
        name: variables({x: 3}),
        employees: {
            ...variables({ "orderBy": "firstName" }),
            id: true,
            firstName: true
        }
    },
    resultType: "TUPLE"
})?.data![0]?.employees[0]?.firstName;

