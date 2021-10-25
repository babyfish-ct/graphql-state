import { ScalarRow } from "../meta/Configuration";
import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { VariableArgs } from "../state/impl/Args";
import { RecordConnection } from "./assocaition/AssociationConnectionValue";
import { BackReferences } from "./BackReferences";
import { EntityManager } from "./EntityManager";
export declare class Record {
    readonly type: TypeMetadata;
    readonly id: any;
    private deleted;
    private scalarMap;
    private associationMap;
    readonly backReferences: BackReferences;
    private row?;
    constructor(type: TypeMetadata, id: any, deleted?: boolean);
    get isDeleted(): boolean;
    hasScalar(fieldName: string): boolean;
    getSalar(fieldName: string): any;
    hasAssociation(field: FieldMetadata, args?: VariableArgs): boolean;
    getAssociation(field: FieldMetadata, args?: VariableArgs): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined;
    set(entityManager: EntityManager, field: FieldMetadata, args: VariableArgs | undefined, value: any): void;
    link(entityManager: EntityManager, associationField: FieldMetadata, record: Record): void;
    unlink(entityManager: EntityManager, associationField: FieldMetadata, record: Record): void;
    contains(field: FieldMetadata, args: VariableArgs | undefined, target: Record, tryMoreStrictArgs: boolean): boolean;
    evict(entityManager: EntityManager, field: FieldMetadata, args: VariableArgs | undefined, includeMoreStrictArgs?: boolean): void;
    delete(entityManager: EntityManager): void;
    undelete(): void;
    toRow(): ScalarRow<any>;
    createMap(): Map<string, any>;
    dispose(entityManager: EntityManager): void;
    private disposeAssocaitions;
}
export declare const QUERY_OBJECT_ID = "____QUERY_OBJECT____";
export declare const MUATION_OBJECT_ID = "____MUTATION_OBJECT____";
export declare function objectWithOnlyId(record: Record | undefined): any;
export declare class ScalarRowImpl implements ScalarRow<any> {
    private map;
    constructor(map: Map<string, any>);
    has(fieldName: string): boolean;
    get(fieldName: string): any;
    toString(): string;
}
