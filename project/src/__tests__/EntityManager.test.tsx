import { cleanup, render, waitForElementToBeRemoved, screen } from "@testing-library/react";
import { memo, Suspense } from "react";
import { typeRefBuilder } from "../meta/Configuration";
import { newConfiguration } from "../meta/impl/ConfigurationImpl";
import { SchemaOf } from "../meta/SchemaTypes";
import { ObjectTypeOf } from "../meta/Shape";
import { makeStateFactory } from "../state/State";
import { useStateValue, useStateAsyncValue } from "../state/StateHook";
import { StateManagerProvider } from "../state/StateManagerProvider";

interface Department {
    readonly id: string;
    readonly name: string;
    readonly employees: Employee[];
}

interface Employee {
    readonly id: string;
    readonly name: string;
    readonly department: Department;
}

const cfg = newConfiguration()
    .addObjectType(typeRefBuilder<Department>().named("Department"))
    .addObjectType(typeRefBuilder<Employee>().named("Employee"))
    .setObjectType("Department", tc => {
        tc
        .id("id")
        .list("employees", "Employee")
    })
    .setObjectType("Employee", tc => {
        tc
        .id("id")
        .reference("department", "Department")
    })
;

const { createParameterizedAsyncState } = makeStateFactory<SchemaOf<typeof cfg>>();

const stateManager = cfg.buildStateManager();
stateManager.addListener(e => {
    let fields = "";
    for (const fieldName of e.fieldNames) {
        fields += fieldName;
        fields += ": ";
        fields += `[${JSON.stringify(e.oldValue(fieldName))} -> ${JSON.stringify(e.newValue(fieldName))}]`
        fields += ", ";
    }
    console.log(`Database trigger> ChangedType: ${e.changedType}, type: ${e.typeName}, fields: ${fields}`);
});

stateManager.save("Department", { id: "id-1", name: "Market" });
stateManager.save("Department", { id: "id-2", name: "Sales" });
stateManager.save("Department", { id: "id-3", name: "Test" });
stateManager.save("Employee", { id: "id-1", name: "Jim", department: { id: "id-1" } });
stateManager.save("Employee", { id: "id-2", name: "Kate", department: { id: "id-1" } });
stateManager.save("Employee", { id: "id-3", name: "Tim", department: { id: "id-2" } });
stateManager.save("Employee", { id: "id-4", name: "Mary", department: { id: "id-2" } });
stateManager.save("Department", { id: "id-1", employees: [ { id: "id-1"}, { id: "id-2"}, { id: "id-3"} ]});
stateManager.save("Department", { id: "id-1", employees: [ { id: "id-3"}, { id: "id-4"} ]});

const DEPARTMENT_SHAPE = {
    id: true,
    name: true,
    employees: {
        id: true,
        name: true
    }
};

const EMPLOYEE_SHAPE = {
    id: true,
    name: true,
    department: {
        id: true,
        name: true
    }
};

const departmentState = createParameterizedAsyncState<
    ObjectTypeOf<Employee, typeof DEPARTMENT_SHAPE> | undefined, 
    { readonly id: string }
>(async (ctx, variables) => {
    return await ctx.query("Department", variables.id, DEPARTMENT_SHAPE);
});

const employeeState = createParameterizedAsyncState<
    ObjectTypeOf<Employee, typeof EMPLOYEE_SHAPE> | undefined, 
    { readonly id: string }
>(async (ctx, variables) => {
    return await ctx.query("Employee", variables.id, EMPLOYEE_SHAPE);
});

const Test = memo(() => {

    const employee = useStateValue(employeeState, {
        variables: { id: "id-1" }
    });
    const employee2 = useStateValue(employeeState, {
        variables: { id: "id-2" }
    });
    const employee3 = useStateValue(employeeState, {
        variables: { id: "id-3" }
    });
    const employee4 = useStateValue(employeeState, {
        variables: { id: "id-4" }
    });
    const department1 = useStateValue(departmentState, {
        variables: { id: "id-1" } 
    });
    // useStateAsyncValue(departmentState, {
    //     variables: { id: "id-2" } 
    // });
    // useStateAsyncValue(departmentState, {
    //     variables: { id: "id-3" } 
    // });

    console.log("result---------------------", employee);
    console.log("result---------------------", employee2);
    console.log("result---------------------", employee3);
    console.log("result---------------------", employee4);
    console.log("result---------------------", department1);

    return (
        <div>
            {JSON.stringify(employee)}
        </div>
    );
});

// Test----------------------------

afterEach(cleanup);

test("Test EntityManager", async () => {
    
    render(
        <StateManagerProvider stateManager={stateManager}>
            <Suspense fallback={<div data-testid="loading">Loading...</div>}>
                <Test/>
            </Suspense>
        </StateManagerProvider>
    );

    await waitForElementToBeRemoved(() => screen.queryByTestId("loading"));
    await delay(1000);
});

function delay(millis: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, millis);
    });
}
