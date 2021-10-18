import { ScalarRow } from "../../meta/Configuration";
import { FieldMetadata } from "../../meta/impl/FieldMetadata";
import { EntityManager } from "../EntityManager";
import { objectWithOnlyId, Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";
import { Association } from "./Association";

export class AssociationReferenceValue extends AssociationValue {

    private referfence?: Record;

    get(): Record | undefined {
        return this.referfence;
    }

    set(
        entityManager: EntityManager, 
        self: Record, 
        associationField: FieldMetadata, 
        value: any
    ) {
        const reference = 
            value !== undefined && value !== null ? 
            entityManager.saveId(associationField.targetType!.name, value[associationField.targetType!.idField.name]) : 
            undefined;

        const oldReference = this.referfence;
        if (oldReference?.id !== reference?.id) {
            this.releaseOldReference(entityManager, self, associationField, oldReference);
            this.referfence = reference;
            this.retainNewReference(entityManager, self, associationField, reference);
            entityManager.modificationContext.set(
                self, 
                associationField.name, 
                this.args?.key,
                objectWithOnlyId(oldReference),
                objectWithOnlyId(reference),
            );
        }
    }

    link(
        entityManager: EntityManager, 
        self: Record, 
        association: Association, 
        target: Record | ReadonlyArray<Record>
    ) {
        let targetRecord: Record;
        if (Array.isArray(target)) {
            if (target.length === 0) {
                return;
            }
            if (target.length > 1) {
                throw new Error(`Internal bug: Cannot link AbstractReerenceValue with array whose length is greater than 1`);
            }
            targetRecord = target.length === 1 ? target[0] : undefined;
        } else {
            targetRecord = target as Record;
        }
        if (this.referfence?.id !== targetRecord?.id) {
            association.set(
                entityManager,
                self,
                this.args,
                objectWithOnlyId(targetRecord)
            );
        }
    }

    unlink(
        entityManager: EntityManager, 
        self: Record, 
        association: Association,
        target: Record | ReadonlyArray<Record>
    ) {
        let targetRecord: Record;
        if (Array.isArray(target)) {
            if (target.length === 0) {
                return;
            }
            if (target.length > 1) {
                throw new Error(`Internal bug: Cannot unlink AbstractReerenceValue with array whose length is greater than 1`);
            }
            targetRecord = target.length === 1 ? target[0] : undefined;
        } else {
            targetRecord = target as Record;
        }
        if (this.referfence?.id === targetRecord.id) {
            association.set(
                entityManager,
                self,
                this.args,
                undefined
            )
        }
    }
}

