import { EntityChangeEvent, EntityEvictEvent } from "..";
import { FlatRow } from "../meta/Configuration";
import { FieldMetadata } from "../meta/impl/FieldMetadata";
import { TypeMetadata } from "../meta/impl/TypeMetdata";
import { VariableArgs } from "../state/impl/Args";
import { GraphObject, EvictReasonType } from "../state/Monitor";
import { RecordConnection } from "./assocaition/AssociationConnectionValue";
import { BackReferences } from "./assocaition/BackReferences";
import { EntityManager, Garbage } from "./EntityManager";
import { Pagination } from "./QueryArgs";
export declare class Record {
    readonly superRecord: Record | undefined;
    readonly staticType: TypeMetadata;
    readonly runtimeType: TypeMetadata;
    readonly id: any;
    private deleted;
    private scalarMap;
    private associationMap;
    readonly backReferences: BackReferences;
    private row?;
    private gcVisited;
    private derivedRecord?;
    constructor(superRecord: Record | undefined, staticType: TypeMetadata, runtimeType: TypeMetadata, id: any, deleted?: boolean);
    get isDeleted(): boolean;
    hasScalar(fieldName: string, args?: VariableArgs): boolean;
    getSalar(fieldName: string, args?: VariableArgs): any;
    hasAssociation(field: FieldMetadata | string, args?: VariableArgs): boolean;
    getAssociation(field: FieldMetadata | string, args?: VariableArgs): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined;
    set(entityManager: EntityManager, field: FieldMetadata, args: VariableArgs | undefined, value: any, pagination?: Pagination): void;
    link(entityManager: EntityManager, associationField: FieldMetadata, record: Record): void;
    unlink(entityManager: EntityManager, associationField: FieldMetadata, record: Record): void;
    contains(field: FieldMetadata, args: VariableArgs | undefined, target: Record, tryMoreStrictArgs: boolean): boolean;
    anyValueContains(field: FieldMetadata, target: Record): boolean | undefined;
    evict(entityManager: EntityManager, field: FieldMetadata, args: VariableArgs | undefined, includeMoreStrictArgs?: boolean, evictReason?: EvictReasonType): void;
    delete(entityManager: EntityManager): void;
    undelete(): boolean;
    toRow(): FlatRow<any>;
    createMap(): Map<string, any>;
    dispose(entityManager: EntityManager): void;
    private disposeAssocaitions;
    refreshBackReferencesByEvictEvent(entityManager: EntityManager, event: EntityEvictEvent): void;
    refreshByChangeEvent(entityManager: EntityManager, field: FieldMetadata, e: EntityChangeEvent): void;
    gcVisit(field: FieldMetadata, args: VariableArgs | undefined): void;
    collectGarbages(output: Garbage[]): void;
    toString(): string;
    private writeTo;
    monitor(): GraphObject;
}
export declare const QUERY_OBJECT_ID = "____QUERY_OBJECT____";
export declare function objectWithOnlyId(record: Record | undefined): any;
export declare class FlatRowImpl implements FlatRow<any> {
    private record;
    constructor(record: Record);
    has(fieldName: string): boolean;
    get(fieldName: string): any;
    toString(): string;
}
