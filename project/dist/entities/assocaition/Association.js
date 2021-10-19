"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Association = void 0;
const SpaceSavingMap_1 = require("../../state/impl/SpaceSavingMap");
const VariableArgs_1 = require("../VariableArgs");
const AssociationConnectionValue_1 = require("./AssociationConnectionValue");
const AssociationListValue_1 = require("./AssociationListValue");
const AssociationReferenceValue_1 = require("./AssociationReferenceValue");
class Association {
    constructor(field) {
        this.field = field;
        this.valueMap = new SpaceSavingMap_1.SpaceSavingMap();
        this.frozen = false;
        if (field.category === "ID") {
            throw new Error("Internal bug: assocaition base on id field");
        }
    }
    has(args) {
        return this.valueMap.get(args === null || args === void 0 ? void 0 : args.key) !== undefined;
    }
    get(args) {
        var _a;
        return (_a = this.valueMap.get(args === null || args === void 0 ? void 0 : args.key)) === null || _a === void 0 ? void 0 : _a.get();
    }
    set(entityManager, record, args, value) {
        if (this.frozen) {
            this.value(args).set(entityManager, record, this, value);
        }
        else {
            this.frozen = true;
            try {
                this.value(args).set(entityManager, record, this, value);
            }
            finally {
                this.frozen = false;
            }
        }
    }
    evict(args) {
        this.valueMap.remove(args === null || args === void 0 ? void 0 : args.key);
    }
    link(entityManager, self, target, mostStringentArgs, changedByOpposite) {
        if (!this.frozen || !changedByOpposite) {
            entityManager.modificationContext.update(self);
            this.valueMap.forEachValue(value => {
                var _a, _b;
                if ((mostStringentArgs === null || mostStringentArgs === void 0 ? void 0 : mostStringentArgs.key) === ((_a = value.args) === null || _a === void 0 ? void 0 : _a.key) && !changedByOpposite) {
                    return;
                }
                if (VariableArgs_1.VariableArgs.contains(mostStringentArgs, value.args)) {
                    value.link(entityManager, self, this, target);
                }
                else {
                    const contains = this.field.associationProperties.contains;
                    const possibleRecords = Array.isArray(target) ? target : [target];
                    const targetRecords = [];
                    let evict = false;
                    for (const possibleRecord of possibleRecords) {
                        const result = contains(possibleRecord.toRow(), (_b = value.args) === null || _b === void 0 ? void 0 : _b.variables);
                        if (result === undefined || result === null) {
                            evict = true;
                            break;
                        }
                        if (result === true) {
                            targetRecords.push(possibleRecord);
                        }
                    }
                    if (evict) {
                        this.evict(value.args);
                    }
                    else if (targetRecords.length !== 0) {
                        value.link(entityManager, self, this, targetRecords);
                    }
                }
            });
        }
    }
    unlink(entityManager, self, target, leastStringentArgs, changedByOpposite) {
        if (!this.frozen || !changedByOpposite) {
            entityManager.modificationContext.update(self);
            this.valueMap.forEachValue(value => {
                var _a;
                if ((leastStringentArgs === null || leastStringentArgs === void 0 ? void 0 : leastStringentArgs.key) === ((_a = value.args) === null || _a === void 0 ? void 0 : _a.key) && !changedByOpposite) {
                    return;
                }
                if (VariableArgs_1.VariableArgs.contains(value.args, leastStringentArgs)) {
                    value.unlink(entityManager, self, this, target);
                }
                else {
                    this.evict(value.args);
                }
            });
        }
    }
    forceUnlink(entityManager, self, target) {
        entityManager.modificationContext.update(self);
        this.valueMap.forEachValue(value => {
            value.unlink(entityManager, self, this, target);
        });
    }
    value(args) {
        return this.valueMap.computeIfAbsent(args === null || args === void 0 ? void 0 : args.key, () => {
            switch (this.field.category) {
                case "CONNECTION":
                    return new AssociationConnectionValue_1.AssociationConnectionValue(args);
                case "LIST":
                    return new AssociationListValue_1.AssociationListValue(args);
                default:
                    return new AssociationReferenceValue_1.AssociationReferenceValue(args);
            }
        });
    }
}
exports.Association = Association;
