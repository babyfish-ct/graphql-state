"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationValue = void 0;
const Record_1 = require("../Record");
class AssociationValue {
    constructor(association, args) {
        this.association = association;
        this.args = args;
        this.gcVisited = false;
        const deps = association.field.associationProperties.dependencies(args === null || args === void 0 ? void 0 : args.filterVariables);
        if (deps === undefined || deps === null || deps.length !== 0) {
            this.dependencies = deps === undefined || deps === null ? "all" : new Set(deps);
        }
    }
    releaseOldReference(entityManager, oldReference) {
        const self = this.association.record;
        if (oldReference !== undefined) {
            oldReference.backReferences.remove(this.association.field, this.args, self);
            this.association.unlink(entityManager, oldReference, this.args, true);
            if (!entityManager.isBidirectionalAssociationManagementSuspending) {
                const oppositeField = this.association.field.oppositeField;
                if (oppositeField !== undefined && this.args === undefined) {
                    if (oldReference) {
                        oldReference.unlink(entityManager, oppositeField, self);
                    }
                }
            }
        }
    }
    retainNewReference(entityManager, newReference) {
        const self = this.association.record;
        if (newReference !== undefined) {
            newReference.backReferences.add(this.association.field, this.args, self);
            this.association.link(entityManager, newReference, this.args, true);
            if (!entityManager.isBidirectionalAssociationManagementSuspending) {
                const oppositeField = this.association.field.oppositeField;
                if (oppositeField !== undefined) {
                    newReference.link(entityManager, oppositeField, self);
                    if (oppositeField.category === "REFERENCE" && !newReference.hasAssociation(oppositeField)) {
                        entityManager.forEach(this.association.field.declaringType.name, record => {
                            if (record.id !== this.association.record.id &&
                                record.contains(this.association.field, undefined, newReference, true)) {
                                record.unlink(entityManager, this.association.field, newReference);
                            }
                        });
                    }
                }
            }
        }
    }
    referesh(entityManager, e) {
        if (e.eventType === "evict") {
            this.refreshByEvictEvent(entityManager, e);
        }
        else if (e.eventType === "change") {
            this.refreshByChangeEvent(entityManager, e);
        }
    }
    refreshByEvictEvent(entityManager, e) {
        if (!e.causedByGC) {
            const targetType = this.association.field.targetType;
            const actualType = entityManager.schema.typeMap.get(e.typeName);
            if (targetType.isAssignableFrom(actualType)) {
                if (e.evictedType === 'row' || this.isTargetChanged(targetType, e.evictedKeys)) {
                    this.evict(entityManager);
                }
            }
        }
    }
    refreshByChangeEvent(entityManager, e) {
        var _a, _b;
        const targetType = this.association.field.targetType;
        const actualType = entityManager.schema.typeMap.get(e.typeName);
        if (targetType.isAssignableFrom(actualType) &&
            e.changedType !== "delete" &&
            this.isTargetChanged(targetType, e.changedKeys)) {
            if (this.association.field.isContainingConfigured) {
                const ref = entityManager.findRefById(targetType.name, e.id);
                if ((ref === null || ref === void 0 ? void 0 : ref.value) !== undefined) {
                    const belongToMe = this.belongToMe(ref.value);
                    if (belongToMe === false) {
                        return;
                    }
                    if (belongToMe === true) {
                        const result = (_a = this.association.field.associationProperties) === null || _a === void 0 ? void 0 : _a.contains(new Record_1.FlatRowImpl(ref.value), (_b = this.args) === null || _b === void 0 ? void 0 : _b.filterVariables);
                        if (result === true) {
                            if (this.contains(ref.value)) {
                                if (this.association.field.isPositionConfigured) {
                                    this.reorder(entityManager, ref.value);
                                }
                            }
                            else {
                                this.link(entityManager, [ref.value]);
                            }
                            return;
                        }
                        if (result === false) {
                            this.unlink(entityManager, [ref.value]);
                            return;
                        }
                    }
                }
            }
            this.evict(entityManager);
        }
    }
    isTargetChanged(targetType, keys) {
        var _a;
        for (const key of keys) {
            if (typeof key === "string") {
                if (this.dependencies === "all") {
                    return true;
                }
                if (((_a = this.dependencies) === null || _a === void 0 ? void 0 : _a.has(key)) === true) {
                    return true;
                }
            }
        }
        return false;
    }
    belongToMe(target) {
        if (this.association.record.runtimeType.name === "Query") {
            return true;
        }
        if (this.association.anyValueContains(target)) {
            return true;
        }
        const oppositeField = this.association.field.oppositeField;
        if (oppositeField !== undefined) {
            const oppositeReferenceMe = target.anyValueContains(oppositeField, this.association.record);
            if (oppositeReferenceMe !== undefined) {
                return oppositeReferenceMe;
            }
        }
        return undefined;
    }
    evict(entityManager) {
        this.association.evict(entityManager, this.args, false);
    }
    get isLinkOptimizable() {
        var _a, _b;
        const paginationInfo = (_a = this.args) === null || _a === void 0 ? void 0 : _a.paginationInfo;
        if ((paginationInfo === null || paginationInfo === void 0 ? void 0 : paginationInfo.style) === "page") {
            return false;
        }
        if (paginationInfo !== undefined && ((_b = this.association.field.associationProperties) === null || _b === void 0 ? void 0 : _b.range) === undefined) {
            return false;
        }
        return true;
    }
}
exports.AssociationValue = AssociationValue;
