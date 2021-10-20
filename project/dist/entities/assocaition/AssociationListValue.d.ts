import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
import { Association } from "./Association";
export declare class AssociationListValue extends AssociationValue {
    private elements?;
    getAsObject(): ReadonlyArray<any> | undefined;
    get(): ReadonlyArray<Record>;
    set(entityManager: EntityManager, self: Record, association: Association, value: any): void;
    link(entityManager: EntityManager, self: Record, association: Association, target: Record | ReadonlyArray<Record>): void;
    unlink(entityManager: EntityManager, self: Record, association: Association, target: Record | ReadonlyArray<Record>): void;
}
