import { FieldMetadata } from "./FieldMetadata";
import { TypeMetadata, TypeMetadataCategory } from "./TypeMetdata";
export declare class SchemaMetadata {
    private _typeMap;
    private _unresolvedPassiveFields;
    private _frozen;
    get typeMap(): ReadonlyMap<string, TypeMetadata>;
    addType(category: TypeMetadataCategory, typeName: any): void;
    private validateTypeName;
    freeze(): this;
    preChange(): void;
    " $registerUnresolvedInversedField"(passiveField: FieldMetadata): void;
    " $resolvedInversedFields"(): void;
}
