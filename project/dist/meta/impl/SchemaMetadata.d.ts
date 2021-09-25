import { FieldMetadata } from "./FieldMetadata";
import { TypeMetadata, TypeMetadataCategory } from "./TypeMetdata";
export declare class SchemaMetadata {
    private _typeMap;
    private _unresolvedPassiveFields;
    get typeMap(): ReadonlyMap<string, TypeMetadata>;
    addType(category: TypeMetadataCategory, typeName: any): void;
    private validateTypeName;
    " $registerUnresolvedInversedField"(passiveField: FieldMetadata): void;
    " $resolvedInversedFields"(): void;
}
