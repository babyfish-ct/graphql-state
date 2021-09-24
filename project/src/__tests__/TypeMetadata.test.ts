import { SchemaMetadata } from "../meta/impl/SchemaMetadata";

let schema = new SchemaMetadata();

beforeEach(() => {
    schema = new SchemaMetadata();
    schema.addType("OBJECT", "Node");
    schema.addType("OBJECT", "Department")
    schema.addType("OBJECT", "Employee");
});

test("superType is not exists", () => {
    
});