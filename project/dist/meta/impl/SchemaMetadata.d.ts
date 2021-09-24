import { TypeMetadataCategory } from "./TypeMetdata";
export declare class SchemaMetadata {
    private typeMap;
    addType(category: TypeMetadataCategory, typeName: any): void;
    private validateTypeName;
}
