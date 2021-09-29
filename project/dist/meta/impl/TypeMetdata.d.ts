import { FieldMetadata, FieldMetadataCategory, FieldMetadataOptions } from "./FieldMetadata";
import { SchemaMetadata } from "./SchemaMetadata";
export declare class TypeMetadata {
    readonly schema: SchemaMetadata;
    readonly category: TypeMetadataCategory;
    readonly name: string;
    private _superType?;
    private _derivedTypes;
    private _rootType?;
    private _declaredFieldMap;
    private _fieldMap;
    private _idField?;
    constructor(schema: SchemaMetadata, category: TypeMetadataCategory, name: string);
    get superType(): TypeMetadata | undefined;
    get derivedType(): ReadonlySet<TypeMetadata>;
    get rootType(): TypeMetadata;
    get declaredFieldMap(): ReadonlyMap<string, FieldMetadata>;
    get fieldMap(): ReadonlyMap<string, FieldMetadata>;
    get idField(): FieldMetadata;
    setSuperType(superType: string): void;
    addField(category: FieldMetadataCategory, name: string, options?: FieldMetadataOptions): void;
    setFieldMappedBy(name: string, oppositeFieldName: string): void;
}
export declare type TypeMetadataCategory = "OBJECT" | "CONNECTION" | "EDGE";
