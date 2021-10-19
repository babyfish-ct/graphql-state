"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationReferenceValue = void 0;
const Record_1 = require("../Record");
const AssocaitionValue_1 = require("./AssocaitionValue");
class AssociationReferenceValue extends AssocaitionValue_1.AssociationValue {
    get() {
        return this.referfence;
    }
    set(entityManager, self, association, value) {
        var _a;
        const reference = value !== undefined && value !== null ?
            entityManager.saveId(association.field.targetType.name, value[association.field.targetType.idField.name]) :
            undefined;
        const oldReference = this.referfence;
        if ((oldReference === null || oldReference === void 0 ? void 0 : oldReference.id) !== (reference === null || reference === void 0 ? void 0 : reference.id)) {
            this.releaseOldReference(entityManager, self, association, oldReference);
            this.referfence = reference;
            this.retainNewReference(entityManager, self, association, reference);
            entityManager.modificationContext.set(self, association.field.name, (_a = this.args) === null || _a === void 0 ? void 0 : _a.key, Record_1.objectWithOnlyId(oldReference), Record_1.objectWithOnlyId(reference));
        }
    }
    link(entityManager, self, association, target) {
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
            association.set(entityManager, self, this.args, Record_1.objectWithOnlyId(targetRecord));
        }
    }
    unlink(entityManager, self, association, target) {
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
            association.set(entityManager, self, this.args, undefined);
        }
    }
}
exports.AssociationReferenceValue = AssociationReferenceValue;
