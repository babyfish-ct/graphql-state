import { SchemaMetadata } from "../meta/impl/SchemaMetadata";
import { newTypedConfiguration } from "./__generated/TypedConfiguration";

test("bind bireactional assocation", () => {
    
    const schema: SchemaMetadata = 
        newTypedConfiguration()
        .bidirectionalAssociation("Department", "employees", "department")
        ["schema"];
    
    const employees = schema.typeMap.get("Department")!.fieldMap.get("employees")!;
    const department = schema.typeMap.get("Employee")!.fieldMap.get("department")!;

    expect(employees.isInversed).toBe(true);
    expect(employees.oppositeField).toBe(department);

    expect(department.isInversed).toBe(false);
    expect(department.oppositeField).toBe(employees);
});