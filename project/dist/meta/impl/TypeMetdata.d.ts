import { FetchableType } from "graphql-ts-client-api";
import { FieldMetadata } from "./FieldMetadata";
import { SchemaMetadata } from "./SchemaMetadata";
export declare class TypeMetadata {
    readonly schema: SchemaMetadata;
    readonly name: string;
    readonly category: TypeMetadataCategory;
    private _superType;
    private _derivedTypes;
    private _rootType?;
    private _declaredFieldMap;
    private _fieldMap;
    private _idField?;
    private _backRefFields;
    constructor(schema: SchemaMetadata, fetchableType: FetchableType<string>);
    get superType(): TypeMetadata | undefined;
    get derivedType(): ReadonlySet<TypeMetadata>;
    get rootType(): TypeMetadata;
    get declaredFieldMap(): ReadonlyMap<string, FieldMetadata>;
    get fieldMap(): ReadonlyMap<string, FieldMetadata>;
    get idField(): FieldMetadata;
    isAssignableFrom(type: TypeMetadata): boolean;
    get backRefFields(): ReadonlyArray<FieldMetadata>;
    setFieldMappedBy(name: string, oppositeFieldName: string): void;
    private addField;
    addBackRefField(backRefField: FieldMetadata): void;
    createObject(id: any): any;
}
export declare type TypeMetadataCategory = "OBJECT" | "EMBEDDED" | "CONNECTION" | "EDGE";
