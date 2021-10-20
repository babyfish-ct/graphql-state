import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
export declare class AssociationConnectionValue extends AssociationValue {
    private connection;
    getAsObject(): ObjectConnection;
    get(): RecordConnection;
    set(entityManager: EntityManager, value: any): void;
    link(entityManager: EntityManager, target: Record | ReadonlyArray<Record>): void;
    unlink(entityManager: EntityManager, target: Record | ReadonlyArray<Record>): void;
    contains(target: Record): boolean;
}
export interface RecordConnection {
    readonly edges: ReadonlyArray<RecordEdge>;
    readonly [key: string]: any;
}
export interface RecordEdge {
    readonly node: Record;
    readonly cursor: string;
}
export interface ObjectConnection {
    readonly edges: ReadonlyArray<ObjectEdge>;
    readonly [key: string]: any;
}
export interface ObjectEdge {
    readonly node: Record;
    readonly cursor: string;
}
