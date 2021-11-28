import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
export declare class AssociationListValue extends AssociationValue {
    private elements?;
    private indexMap?;
    getAsObject(): ReadonlyArray<any> | undefined;
    get(): ReadonlyArray<Record>;
    set(entityManager: EntityManager, value: ReadonlyArray<any>): void;
    link(entityManager: EntityManager, targets: ReadonlyArray<Record>): void;
    unlink(entityManager: EntityManager, targets: ReadonlyArray<Record>): void;
    contains(target: Record): boolean;
    protected reorder(entityManager: EntityManager, target: Record): void;
    private validate;
    private valueEquals;
}
