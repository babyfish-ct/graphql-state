import { EntityManager } from "../EntityManager";
import { objectWithOnlyId, Record } from "../Record";
import { AssociationValue } from "./AssocaitionValue";

export class AssociationReferenceValue extends AssociationValue {

    private referfence?: Record;

    getAsObject(): any | undefined {
        return objectWithOnlyId(this.referfence);
    }

    get(): Record | undefined {
        return this.referfence;
    }

    set(
        entityManager: EntityManager, 
        value: any
    ) {
        const association = this.association;
        const reference = 
            value !== undefined && value !== null ? 
            entityManager.saveId(association.field.targetType!.name, value[association.field.targetType!.idField.name]) : 
            undefined;

        const oldReference = this.referfence;
        if (oldReference?.id !== reference?.id) {
            this.releaseOldReference(entityManager, oldReference);
            this.referfence = reference;
            this.retainNewReference(entityManager, reference);
            entityManager.modificationContext.set(
                this.association.record, 
                association.field.name, 
                this.args,
                objectWithOnlyId(oldReference),
                objectWithOnlyId(reference),
            );
        }
    }

    link(
        entityManager: EntityManager, 
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
            this.association.set(
                entityManager,
                this.args,
                objectWithOnlyId(targetRecord)
            );
        }
    }

    unlink(
        entityManager: EntityManager, 
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
            this.association.set(
                entityManager,
                this.args,
                undefined
            )
        }
    }

    contains(target: Record): boolean {
        return this.referfence?.id === target.id;
    }
}

