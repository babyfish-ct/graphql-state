import { FieldMetadata } from "../../meta/impl/FieldMetadata";
import { EntityManager } from "../EntityManager";
import { Record } from "../Record";
import { VariableArgs } from "../VariableArgs";
import { Association } from "./Association";
import { RecordConnection } from "./AssociationConnectionValue";

export abstract class AssociationValue {

    constructor(readonly args?: VariableArgs) {}

    abstract get(): Record | ReadonlyArray<Record | undefined> | RecordConnection | undefined;

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
        associationField: FieldMetadata, 
        oldRefernce: Record | undefined
    ) {
        if (oldRefernce !== undefined) {
            oldRefernce.backReferences.remove(
                associationField, 
                this.args,
                self
            );
            const oppositeField = associationField.oppositeField;
            if (oppositeField !== undefined) {
                if (oldRefernce) {
                    oldRefernce.unlink(entityManager, oppositeField, self);
                }
            }
        }
    }

    protected retainNewReference(
        entityManager: EntityManager,
        self: Record,
        associationField: FieldMetadata, 
        newReference: Record | undefined
    ) {
        if (newReference !== undefined) {
            newReference.backReferences.add(
                associationField, 
                this.args,
                self
            );
            const oppositeField = associationField.oppositeField;
            if (oppositeField !== undefined) {
                newReference.link(entityManager, oppositeField, self);
            }
        }
    }
}
