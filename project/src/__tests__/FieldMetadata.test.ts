import { SchemaMetadata } from "../meta/impl/SchemaMetadata";

let schema = new SchemaMetadata();

beforeEach(() => {
    schema = new SchemaMetadata();
    schema.addType("OBJECT", "Department")
    schema.addType("OBJECT", "Employee");
});

test("bind bireactional assocation", () => {
    
    schema.typeMap.get("Department")!.addField(
        "LIST",
        "employees", 
        {
            targetTypeName: "Employee",
            mappedBy: "department"
        }
    );
    schema.typeMap.get("Employee")!.addField(
        "REFERENCE",
        "department",
        {
            targetTypeName: "Department"
        }
    );

    const employees = schema.typeMap.get("Department")!.fieldMap.get("employees")!;
    const department = schema.typeMap.get("Employee")!.fieldMap.get("department")!;

    expect(employees.isPassive).toBe(true);
    expect(employees.oppositeField).toBe(department);

    expect(department.isPassive).toBe(false);
    expect(department.oppositeField).toBe(employees);
});