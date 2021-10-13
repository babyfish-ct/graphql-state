import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { BackReferences } from "./BackReferences";
import { EntityManager } from "./EntityManager";
export declare class Record {
    readonly type: TypeMetadata;
    readonly id: any;
    private deleted;
    private scalarMap;
    private associationMap;
    readonly backReferences: BackReferences;
    constructor(type: TypeMetadata, id: any, deleted?: boolean);
    hasScalar(fieldName: string): boolean;
    getSalar(fieldName: string): any;
    hasAssociation(field: FieldMetadata, variables: any): boolean;
    getAssociation(field: FieldMetadata, variables: any): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined;
    set(entityManager: EntityManager, field: FieldMetadata, variablesCode: string | undefined, variables: any, value: any): void;
    get isDeleted(): boolean;
    delete(entityManager: EntityManager): void;
    undelete(): void;
    link(entityManager: EntityManager, associationField: FieldMetadata, target: Record): void;
    unlink(entityManager: EntityManager, associationField: FieldMetadata, target: Record): void;
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
