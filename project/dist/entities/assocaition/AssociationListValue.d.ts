import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
export declare class AssociationListValue extends AssociationValue {
    private elements?;
    getAsObject(): ReadonlyArray<any> | undefined;
    get(): ReadonlyArray<Record>;
    set(entityManager: EntityManager, value: ReadonlyArray<any>): void;
    link(entityManager: EntityManager, target: Record | ReadonlyArray<Record>): void;
    unlink(entityManager: EntityManager, target: Record | ReadonlyArray<Record>): void;
    contains(target: Record): boolean;
    private validate;
    private valueEquals;
}
