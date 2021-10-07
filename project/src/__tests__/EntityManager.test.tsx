import { cleanup, render, waitForElementToBeRemoved, screen } from "@testing-library/react";
import { ModelType } from "graphql-ts-client-api";
import { memo, Suspense } from "react";
import { newConfiguration } from "../meta/impl/ConfigurationImpl";
import { makeStateFactory } from "../state/State";
import { useStateValue, useStateAsyncValue } from "../state/StateHook";
import { StateManagerProvider } from "../state/StateManagerProvider";
import { department$, department$$, employee$, employee$$ } from "./__generated/fetchers";
import { newTypedConfiguration, Schema } from "./__generated/TypedConfiguration";

const cfg = newTypedConfiguration();

const { createParameterizedAsyncState } = makeStateFactory<Schema>();

const stateManager = cfg.buildStateManager();
stateManager.addListener(e => {
    let fields = "";
    for (const key of e.changedKeys) {
        fields += key;
        fields += ": ";
        fields += `[${JSON.stringify(e.oldValue(key))} -> ${JSON.stringify(e.newValue(key))}]`
        fields += ", ";
    }
    console.log(`Database trigger> ChangedType: ${e.changedType}, type: ${e.typeName}, fields: ${fields}`);
});

const DEPARTMENT_MUTATION_INFO = department$.id.employees(employee$.id);
const EMPLOYEE_MUTATION_INFO = employee$$.department(department$.id);

stateManager.save(department$$, { id: "id-1", name: "Market" });
stateManager.save(department$$, { id: "id-2", name: "Sales" });
stateManager.save(department$$, { id: "id-3", name: "Test" });
stateManager.save(EMPLOYEE_MUTATION_INFO, { id: "id-1", name: "Jim", department: { id: "id-1" } });
stateManager.save(EMPLOYEE_MUTATION_INFO, { id: "id-2", name: "Kate", department: { id: "id-1" } });
stateManager.save(EMPLOYEE_MUTATION_INFO, { id: "id-3", name: "Tim", department: { id: "id-2" } });
stateManager.save(EMPLOYEE_MUTATION_INFO, { id: "id-4", name: "Mary", department: { id: "id-2" } });
stateManager.save(DEPARTMENT_MUTATION_INFO, { id: "id-1", employees: [ { id: "id-1"}, { id: "id-2"}, { id: "id-3"} ]});
stateManager.save(DEPARTMENT_MUTATION_INFO, { id: "id-1", employees: [ { id: "id-3"}, { id: "id-4"} ]});

const DEPARTMENT_SHAPE = 
    department$$
    .employees(
        employee$$
    );

const EMPLOYEE_SHAPE = 
    employee$$
    .department(
        department$$
    );

const departmentState = createParameterizedAsyncState<
    ModelType<typeof DEPARTMENT_SHAPE> | undefined, 
    { readonly id: string }
>(async (ctx, variables) => {
    return await ctx.object(DEPARTMENT_SHAPE, variables.id);
});

const employeeState = createParameterizedAsyncState<
    ModelType<typeof EMPLOYEE_SHAPE> | undefined, 
    { readonly id: string }
>(async (ctx, variables) => {
    return await ctx.object(EMPLOYEE_SHAPE, variables.id);
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
