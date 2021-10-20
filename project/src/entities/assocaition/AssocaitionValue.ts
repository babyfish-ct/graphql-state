import { FieldMetadata } from "../../meta/impl/FieldMetadata";
import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { VariableArgs } from "../VariableArgs";
import { Association } from "./Association";
import { ObjectConnection, RecordConnection } from "./AssociationConnectionValue";

export abstract class AssociationValue {

    constructor(readonly args?: VariableArgs) {}

    abstract getAsObject(): any | ReadonlyArray<any> | ObjectConnection | undefined;

    abstract get(): Record | ReadonlyArray<Record> | RecordConnection | undefined;

    abstract set(
        entityManager: EntityManager, 
        self: Record, 
        association: Association, 
        value: any
    ): void;

    abstract link(
        entityManager: EntityManager, 
        self: Record, 
        association: Association, 
        target: Record | ReadonlyArray<Record>
    ): void;

    abstract unlink(
        entityManager: EntityManager, 
        self: Record, 
        association: Association, 
        target: Record | ReadonlyArray<Record>
    ): void;

    protected releaseOldReference(
        entityManager: EntityManager,
        self: Record,
        association: Association, 
        oldReference: Record | undefined
    ) {
        if (oldReference !== undefined) {
            oldReference.backReferences.remove(
                association.field, 
                this.args,
                self
            );
            association.unlink(entityManager, self, oldReference, this.args, false);
            const oppositeField = association.field.oppositeField;
            if (oppositeField !== undefined) {
                if (oldReference) {
                    oldReference.unlink(entityManager, oppositeField, self);
                }
            }
        }
    }

    protected retainNewReference(
        entityManager: EntityManager,
        self: Record,
        association: Association,
        newReference: Record | undefined
    ) {
        if (newReference !== undefined) {
            newReference.backReferences.add(
                association.field, 
                this.args,
                self
            );
            association.link(entityManager, self, newReference, this.args, false);
            const oppositeField = association.field.oppositeField;
            if (oppositeField !== undefined) {
                newReference.link(entityManager, oppositeField, self);
            }
        }
    }
}
