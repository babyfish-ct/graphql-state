import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { BackReferences } from "./BackReferences";
import { EntityManager } from "./EntityManager";
import { ModificationContext } from "./ModificationContext";
export declare class Record {
    readonly type: TypeMetadata;
    readonly id: any;
    private scalarMap;
    private associationMap;
    readonly backReferences: BackReferences;
    private deleted;
    private linkFrozen;
    constructor(type: TypeMetadata, id: any);
    hasScalar(fieldName: string): boolean;
    getSalar(fieldName: string): any;
    hasAssociation(field: FieldMetadata, variables: any): boolean;
    getAssociation(field: FieldMetadata, variables: any): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined;
    set(ctx: ModificationContext, entityManager: EntityManager, field: FieldMetadata, variablesCode: string | undefined, variables: any, value: any): void;
    undeleted(): this;
    get isDeleted(): boolean;
    link(ctx: ModificationContext, entityManager: EntityManager, associationField: FieldMetadata, target: Record): void;
    unlink(ctx: ModificationContext, entityManager: EntityManager, associationField: FieldMetadata, target: Record): void;
}
export interface RecordConnection {
    readonly edges: ReadonlyArray<RecordEdge>;
    readonly [key: string]: any;
}
export interface RecordEdge {
    readonly node: Record;
    readonly cursor: string;
}
