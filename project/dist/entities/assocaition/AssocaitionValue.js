"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationValue = void 0;
class AssociationValue {
    constructor(args) {
        this.args = args;
    }
    releaseOldReference(entityManager, self, associationField, oldRefernce) {
        if (oldRefernce !== undefined) {
            oldRefernce.backReferences.remove(associationField, this.args, self);
            const oppositeField = associationField.oppositeField;
            if (oppositeField !== undefined) {
                if (oldRefernce) {
                    oldRefernce.unlink(entityManager, oppositeField, self);
                }
            }
        }
    }
    retainNewReference(entityManager, self, associationField, newReference) {
        if (newReference !== undefined) {
            newReference.backReferences.add(associationField, this.args, self);
            const oppositeField = associationField.oppositeField;
            if (oppositeField !== undefined) {
                newReference.link(entityManager, oppositeField, self);
            }
        }
    }
}
exports.AssociationValue = AssociationValue;
