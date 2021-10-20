import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
import { Association } from "./Association";
export declare class AssociationConnectionValue extends AssociationValue {
    private connection;
    getAsObject(): ObjectConnection;
    get(): RecordConnection;
    set(entityManager: EntityManager, record: Record, association: Association, value: any): void;
    link(entityManager: EntityManager, self: Record, association: Association, target: Record | ReadonlyArray<Record>): void;
    unlink(entityManager: EntityManager, self: Record, association: Association, target: Record | ReadonlyArray<Record>): void;
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
