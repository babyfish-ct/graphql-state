import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
export declare class AssociationReferenceValue extends AssociationValue {
    private referfence?;
    getAsObject(): any | undefined;
    get(): Record | undefined;
    set(entityManager: EntityManager, value: any): void;
    link(entityManager: EntityManager, targets: ReadonlyArray<Record>): void;
    unlink(entityManager: EntityManager, targets: ReadonlyArray<Record>): void;
    contains(target: Record): boolean;
    protected reorder(entityManager: EntityManager, target: Record): void;
}
