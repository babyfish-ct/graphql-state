import { FieldMetadata } from "../../meta/impl/FieldMetadata";
import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
import { Association } from "./Association";
export declare class AssociationConnectionValue extends AssociationValue {
    private connection;
    get(): RecordConnection;
    set(entityManager: EntityManager, record: Record, associationField: FieldMetadata, value: any): void;
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
