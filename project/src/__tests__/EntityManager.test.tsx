import { typeRefBuilder } from "../meta/Configuration";
import { newConfiguration } from "../meta/impl/ConfigurationImpl";

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

test("Test EntityManager", () => {
    const stateManager = cfg.buildStateManager();
    stateManager.saveObject("Department", { id: "id-1", name: "Market" });
    stateManager.saveObject("Department", { id: "id-2", name: "Sales" });
    stateManager.saveObject("Employee", { id: "id-1", name: "Jim", department: { id: "id-1" } });
    stateManager.saveObject("Employee", { id: "id-2", name: "Kate", department: { id: "id-1" } });
    stateManager.saveObject("Employee", { id: "id-3", name: "Tim", department: { id: "id-2" } });
    stateManager.saveObject("Employee", { id: "id-4", name: "Mary", department: { id: "id-2" } });
    stateManager.saveObject("Department", { id: "id-1", employees: [ { id: "id-1"}, { id: "id-2"}, { id: "id-3"} ]});
    stateManager.saveObject("Department", { id: "id-1", employees: [ { id: "id-3"}, { id: "id-4"} ]});
    console.log(stateManager);
});