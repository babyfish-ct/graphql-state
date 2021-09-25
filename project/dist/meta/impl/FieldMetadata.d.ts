import { TypeMetadata } from "./TypeMetdata";
export declare class FieldMetadata {
    readonly type: TypeMetadata;
    readonly category: FieldMetadataCategory;
    readonly name: string;
    readonly fullName: string;
    private _inversed;
    private _undefinable;
    private _deleteOperation?;
    private _connectionType?;
    private _edgeType?;
    private _targetType?;
    private _oppositeField?;
    constructor(type: TypeMetadata, category: FieldMetadataCategory, name: string, options?: FieldMetadataOptions);
    get isUndefinable(): boolean;
    get deleteOperation(): "CASCADE" | "SET_UNDEFINED" | undefined;
    get isInversed(): boolean;
    get connectionType(): TypeMetadata | undefined;
    get edgeType(): TypeMetadata | undefined;
    get targetType(): TypeMetadata | undefined;
    get oppositeField(): FieldMetadata | undefined;
    setOppositeFieldName(oppositeFieldName: string): void;
    " $resolveInversedAssociation"(): void;
}
export declare type FieldMetadataCategory = "ID" | "REFERENCE" | "LIST" | "CONNECTION";
export interface FieldMetadataOptions {
    readonly undefinable?: boolean;
    readonly deleteOperation?: "CASCADE" | "SET_UNDEFINED";
    readonly connectionTypeName?: string;
    readonly edgeTypeName?: string;
    readonly targetTypeName?: string;
    readonly mappedBy?: string;
}
