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
        const oldReference = this.referfence;
        const reference = 
            value !== undefined && value !== null ? 
            entityManager.saveId(
                value["__typename"] ?? association.field.targetType!.name, 
                value[association.field.targetType!.idField.name]
            ) : 
            undefined;
    
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
        targets: ReadonlyArray<Record>
    ) {
        if (targets.length === 0) {
            return;
        }
        if (targets.length > 1) {
            throw new Error(`Internal bug: Cannot link AbstractReerenceValue with array whose length is greater than 1`);
        }
        const targetRecord = targets.length === 1 ? targets[0] : undefined;
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
        targets: ReadonlyArray<Record>
    ) {
        if (targets.length === 0) {
            return;
        }
        if (targets.length > 1) {
            throw new Error(`Internal bug: Cannot link AbstractReerenceValue with array whose length is greater than 1`);
        }
        const targetRecord = targets.length === 1 ? targets[0] : undefined;
        if (this.referfence?.id === targetRecord?.id) {
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

