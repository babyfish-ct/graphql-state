import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { VariableArgs } from "../VariableArgs";
import { Association } from "./Association";
import { ObjectConnection, RecordConnection } from "./AssociationConnectionValue";
export declare abstract class AssociationValue {
    readonly args?: VariableArgs | undefined;
    constructor(args?: VariableArgs | undefined);
    abstract getAsObject(): any | ReadonlyArray<any> | ObjectConnection | undefined;
    abstract get(): Record | ReadonlyArray<Record> | RecordConnection | undefined;
    abstract set(entityManager: EntityManager, self: Record, association: Association, value: any): void;
    abstract link(entityManager: EntityManager, self: Record, association: Association, target: Record | ReadonlyArray<Record>): void;
    abstract unlink(entityManager: EntityManager, self: Record, association: Association, target: Record | ReadonlyArray<Record>): void;
    protected releaseOldReference(entityManager: EntityManager, self: Record, association: Association, oldReference: Record | undefined): void;
    protected retainNewReference(entityManager: EntityManager, self: Record, association: Association, newReference: Record | undefined): void;
}
