import { SchemaMetadata } from "../meta/impl/SchemaMetadata";

test("illegal typeName", () => {
    expect(() => new SchemaMetadata().addType("OBJECT", " "))
    .toThrow(`typeName " " does not match the pattern "^[_A-Za-z][_A-Za-z0-0]*$"`)
});

test("duplicate typeName", () => {
    expect(() => { 
        const schema = new SchemaMetadata();
        schema.addType("OBJECT", "A"); 
        schema.addType("CONNECTION", "A"); 
    }).toThrow(`Cannot add the type \"A\" becasue it's exists`);
});

test("success", () => {
    const schema = new SchemaMetadata();
    schema.addType("OBJECT", "A");
    schema.addType("CONNECTION", "B");
    schema.addType("EDGE", "C");
    expect(
        Array
        .from(schema.typeMap.entries())
        .map(pair => [pair[0], pair[1].name, pair[1].category])
    ).toEqual([
        ["A", "A", "OBJECT"],
        ["B", "B", "CONNECTION"],
        ["C", "C", "EDGE"]
    ])
});