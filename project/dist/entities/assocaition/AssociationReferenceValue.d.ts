import { FieldMetadata } from "../../meta/impl/FieldMetadata";
import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
import { Association } from "./Association";
export declare class AssociationReferenceValue extends AssociationValue {
    private referfence?;
    get(): Record | undefined;
    set(entityManager: EntityManager, self: Record, associationField: FieldMetadata, value: any): void;
    link(entityManager: EntityManager, self: Record, association: Association, target: Record | ReadonlyArray<Record>): void;
    unlink(entityManager: EntityManager, self: Record, association: Association, target: Record | ReadonlyArray<Record>): void;
}
