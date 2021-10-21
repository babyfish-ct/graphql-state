import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
export declare class AssociationConnectionValue extends AssociationValue {
    private connection?;
    private indexMap?;
    getAsObject(): ObjectConnection;
    get(): RecordConnection;
    set(entityManager: EntityManager, value: ObjectConnection): void;
    link(entityManager: EntityManager, targets: ReadonlyArray<Record>): void;
    unlink(entityManager: EntityManager, targets: ReadonlyArray<Record>): void;
    contains(target: Record): boolean;
    private validate;
    private valueEquals;
}
export interface RecordConnection {
    readonly edges: ReadonlyArray<RecordEdge>;
    readonly pageInfo: PageInfo;
    readonly [key: string]: any;
}
export interface RecordEdge {
    readonly node: Record;
    readonly cursor: string;
}
export interface ObjectConnection {
    readonly edges: ReadonlyArray<ObjectEdge>;
    readonly pageInfo: PageInfo;
    readonly [key: string]: any;
}
export interface ObjectEdge {
    readonly node: any;
    readonly cursor: string;
}
export interface PageInfo {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
}
