"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationValue = void 0;
class AssociationValue {
    constructor(args) {
        this.args = args;
    }
    releaseOldReference(entityManager, self, association, oldReference) {
        if (oldReference !== undefined) {
            oldReference.backReferences.remove(association.field, this.args, self);
            association.unlink(entityManager, self, oldReference, this.args, false);
            const oppositeField = association.field.oppositeField;
            if (oppositeField !== undefined) {
                if (oldReference) {
                    oldReference.unlink(entityManager, oppositeField, self);
                }
            }
        }
    }
    retainNewReference(entityManager, self, association, newReference) {
        if (newReference !== undefined) {
            newReference.backReferences.add(association.field, this.args, self);
            association.link(entityManager, self, newReference, this.args, false);
            const oppositeField = association.field.oppositeField;
            if (oppositeField !== undefined) {
                newReference.link(entityManager, oppositeField, self);
            }
        }
    }
}
exports.AssociationValue = AssociationValue;
