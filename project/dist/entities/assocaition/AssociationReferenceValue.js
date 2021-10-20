"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationReferenceValue = void 0;
const Record_1 = require("../Record");
const AssocaitionValue_1 = require("./AssocaitionValue");
class AssociationReferenceValue extends AssocaitionValue_1.AssociationValue {
    getAsObject() {
        return Record_1.objectWithOnlyId(this.referfence);
    }
    get() {
        return this.referfence;
    }
    set(entityManager, value) {
        const association = this.association;
        const reference = value !== undefined && value !== null ?
            entityManager.saveId(association.field.targetType.name, value[association.field.targetType.idField.name]) :
            undefined;
        const oldReference = this.referfence;
        if ((oldReference === null || oldReference === void 0 ? void 0 : oldReference.id) !== (reference === null || reference === void 0 ? void 0 : reference.id)) {
            this.releaseOldReference(entityManager, oldReference);
            this.referfence = reference;
            this.retainNewReference(entityManager, reference);
            entityManager.modificationContext.set(this.association.record, association.field.name, this.args, Record_1.objectWithOnlyId(oldReference), Record_1.objectWithOnlyId(reference));
        }
    }
    link(entityManager, target) {
        var _a;
        let targetRecord;
        if (Array.isArray(target)) {
            if (target.length === 0) {
                return;
            }
            if (target.length > 1) {
                throw new Error(`Internal bug: Cannot link AbstractReerenceValue with array whose length is greater than 1`);
            }
            targetRecord = target.length === 1 ? target[0] : undefined;
        }
        else {
            targetRecord = target;
        }
        if (((_a = this.referfence) === null || _a === void 0 ? void 0 : _a.id) !== (targetRecord === null || targetRecord === void 0 ? void 0 : targetRecord.id)) {
            this.association.set(entityManager, this.args, Record_1.objectWithOnlyId(targetRecord));
        }
    }
    unlink(entityManager, target) {
        var _a;
        let targetRecord;
        if (Array.isArray(target)) {
            if (target.length === 0) {
                return;
            }
            if (target.length > 1) {
                throw new Error(`Internal bug: Cannot unlink AbstractReerenceValue with array whose length is greater than 1`);
            }
            targetRecord = target.length === 1 ? target[0] : undefined;
        }
        else {
            targetRecord = target;
        }
        if (((_a = this.referfence) === null || _a === void 0 ? void 0 : _a.id) === targetRecord.id) {
            this.association.set(entityManager, this.args, undefined);
        }
    }
}
exports.AssociationReferenceValue = AssociationReferenceValue;
