import { EntityChangeEvent, EntityEvictEvent } from "../EntityEvent";
import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { VariableArgs } from "../VariableArgs";
import { Association } from "./Association";
import { ObjectConnection, RecordConnection } from "./AssociationConnectionValue";
export declare abstract class AssociationValue {
    readonly association: Association;
    readonly args?: VariableArgs | undefined;
    private dependencies?;
    constructor(entityManager: EntityManager, association: Association, args?: VariableArgs | undefined);
    abstract getAsObject(): any | ReadonlyArray<any> | ObjectConnection | undefined;
    abstract get(): Record | ReadonlyArray<Record> | RecordConnection | undefined;
    abstract set(entityManager: EntityManager, value: any): void;
    abstract link(entityManager: EntityManager, targets: ReadonlyArray<Record>): void;
    abstract unlink(entityManager: EntityManager, targets: ReadonlyArray<Record>): void;
    abstract contains(target: Record): boolean;
    protected releaseOldReference(entityManager: EntityManager, oldReference: Record | undefined): void;
    protected retainNewReference(entityManager: EntityManager, newReference: Record | undefined): void;
    dispose(entityManager: EntityManager): void;
    onEntityEvict(entityManager: EntityManager, e: EntityEvictEvent): void;
    onEntityChange(entityManager: EntityManager, e: EntityChangeEvent): void;
    private isTargetChanged;
    protected evict(entityManager: EntityManager): void;
}
