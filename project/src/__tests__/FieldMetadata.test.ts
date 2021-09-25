import { SchemaMetadata } from "../meta/impl/SchemaMetadata";

test("bind bireactional assocation", () => {
    
    const schema = new SchemaMetadata();
    
    schema.addType("OBJECT", "Department");
    schema.typeMap.get("Department")!.addField(
        "LIST",
        "employees", 
        {
            targetTypeName: "Employee",
            mappedBy: "department"
        }
    );
    
    schema.addType("OBJECT", "Employee");
    schema.typeMap.get("Employee")!.addField(
        "REFERENCE",
        "department",
        {
            targetTypeName: "Department"
        }
    );

    const employees = schema.typeMap.get("Department")!.fieldMap.get("employees")!;
    const department = schema.typeMap.get("Employee")!.fieldMap.get("department")!;

    expect(employees.isInversed).toBe(true);
    expect(employees.oppositeField).toBe(department);

    expect(department.isInversed).toBe(false);
    expect(department.oppositeField).toBe(employees);
});