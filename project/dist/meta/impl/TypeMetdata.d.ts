import { SchemaMetadata } from "./SchemaMetadata";
export declare class TypeMetadata {
    private schema;
    private category;
    private name;
    constructor(schema: SchemaMetadata, category: TypeMetadataCategory, name: string);
}
export declare type TypeMetadataCategory = "OBJECT" | "CONNECTION" | "EDGE";
