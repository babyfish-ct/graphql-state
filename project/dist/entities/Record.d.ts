import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { BackReferences } from "./BackReferences";
import { EntityManager } from "./EntityManager";
import { VariableArgs } from "./VariableArgs";
export declare class Record {
    readonly type: TypeMetadata;
    readonly id: any;
    private deleted;
    private scalarMap;
    private associationMap;
    readonly backReferences: BackReferences;
    constructor(type: TypeMetadata, id: any, deleted?: boolean);
    get isDeleted(): boolean;
    hasScalar(fieldName: string): boolean;
    getSalar(fieldName: string): any;
    hasAssociation(field: FieldMetadata, args: VariableArgs): boolean;
    getAssociation(field: FieldMetadata, args: VariableArgs): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined;
    set(entityManager: EntityManager, field: FieldMetadata, args: VariableArgs, value: any): void;
    link(entityManager: EntityManager, associationField: FieldMetadata, record: Record): void;
    unlink(entityManager: EntityManager, associationField: FieldMetadata, record: Record): void;
    delete(entityManager: EntityManager): void;
    undelete(): void;
}
export interface RecordConnection {
    readonly edges: ReadonlyArray<RecordEdge>;
    readonly [key: string]: any;
}
export interface RecordEdge {
    readonly node: Record;
    readonly cursor: string;
}
export declare const QUERY_OBJECT_ID = "unique-id-of-qury-object";
