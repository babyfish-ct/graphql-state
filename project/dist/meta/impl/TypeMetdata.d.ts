import { FieldMetadata, FieldMetadataCategory, FieldMetadataOptions } from "./FieldMetadata";
import { SchemaMetadata } from "./SchemaMetadata";
export declare class TypeMetadata {
    readonly schema: SchemaMetadata;
    readonly category: TypeMetadataCategory;
    readonly name: string;
    private _superType?;
    private _declaredFieldMap;
    private _fieldMap;
    constructor(schema: SchemaMetadata, category: TypeMetadataCategory, name: string);
    get superType(): TypeMetadata | undefined;
    get declaredFieldMap(): ReadonlyMap<string, FieldMetadata>;
    get fieldMap(): ReadonlyMap<string, FieldMetadata>;
    setSuperType(superType: string): void;
    addField(category: FieldMetadataCategory, name: string, options?: FieldMetadataOptions): void;
    setFieldMappedBy(name: string, oppositeFieldName: string): void;
}
export declare type TypeMetadataCategory = "OBJECT" | "CONNECTION" | "EDGE";
