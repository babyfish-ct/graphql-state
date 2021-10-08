import { cleanup, render, waitForElementToBeRemoved, screen } from "@testing-library/react";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, Suspense } from "react";
import { useStateValue } from "..";
import { makeStateFactory } from "../state/State";
import { StateManagerProvider } from "../state/StateManagerProvider";
import { department$, department$$, employee$, employee$$ } from "./__generated/fetchers";
import { newTypedConfiguration, Schema } from "./__generated/TypedConfiguration";

const cfg = 
    newTypedConfiguration()
    .bidirectionalAssociation("Department", "employees", "department");

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

stateManager.save(
    department$$
    .employees(
        employee$$
    ), 
    {
        id: "id-1",
        name: "Develop",
        employees: [
            { id: "id-1", name: "Jim" },
            { id: "id-2", name: "Kate" }
        ]
    }
);
stateManager.save(
    department$$
    .employees(
        employee$$
    ), 
    {
        id: "id-2",
        name: "Test",
        employees: [
            { id: "id-3", name: "Smith" },
            { id: "id-4", name: "Linda" }
        ]
    }
);

// Test----------------------------

afterEach(cleanup);

const Test = memo(() => {

    const department1 = useStateValue(departmentState, { variables: { id: "id-1" }});
    const department2 = useStateValue(departmentState, { variables: { id: "id-2" }});
    return (
        <div>
            
        </div>
    );
});

const DepartmentView: FC<{id: string}> = memo(({id}) => {
    return (
        <div>
            <h1>Department</h1>
        </div>
    );
});

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
