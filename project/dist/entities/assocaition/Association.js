"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Association = void 0;
const SpaceSavingMap_1 = require("../../state/impl/SpaceSavingMap");
const VariableArgs_1 = require("../VariableArgs");
const AssociationConnectionValue_1 = require("./AssociationConnectionValue");
const AssociationListValue_1 = require("./AssociationListValue");
const AssociationReferenceValue_1 = require("./AssociationReferenceValue");
class Association {
    constructor(record, field) {
        this.record = record;
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
    set(entityManager, args, value) {
        if (this.frozen) {
            this.value(entityManager, args).set(entityManager, value);
        }
        else {
            this.frozen = true;
            try {
                this.value(entityManager, args).set(entityManager, value);
            }
            finally {
                this.frozen = false;
            }
        }
    }
    evict(entityManager, args) {
        const value = this.valueMap.get(args === null || args === void 0 ? void 0 : args.key);
        if (value !== undefined) {
            value.dispose(entityManager);
            this.valueMap.remove(args === null || args === void 0 ? void 0 : args.key);
        }
    }
    link(entityManager, target, mostStringentArgs, changedByOpposite) {
        if (!this.frozen || !changedByOpposite) {
            entityManager.modificationContext.update(this.record);
            this.valueMap.forEachValue(value => {
                var _a, _b;
                if ((mostStringentArgs === null || mostStringentArgs === void 0 ? void 0 : mostStringentArgs.key) === ((_a = value.args) === null || _a === void 0 ? void 0 : _a.key) && !changedByOpposite) {
                    return;
                }
                if (VariableArgs_1.VariableArgs.contains(mostStringentArgs, value.args)) {
                    value.link(entityManager, target);
                }
                else {
                    const contains = this.field.associationProperties.contains;
                    const possibleRecords = Array.isArray(target) ? target : [target];
                    const targetRecords = [];
                    let evict = false;
                    for (const possibleRecord of possibleRecords) {
                        const result = contains(possibleRecord.toRow(), (_b = value.args) === null || _b === void 0 ? void 0 : _b.variables);
                        if (result === undefined) {
                            evict = true;
                            break;
                        }
                        if (result === true) {
                            targetRecords.push(possibleRecord);
                        }
                    }
                    if (evict) {
                        this.evict(entityManager, value.args);
                    }
                    else if (targetRecords.length !== 0) {
                        value.link(entityManager, targetRecords);
                    }
                }
            });
        }
    }
    unlink(entityManager, target, leastStringentArgs, changedByOpposite) {
        if (!this.frozen || !changedByOpposite) {
            entityManager.modificationContext.update(this.record);
            this.valueMap.forEachValue(value => {
                var _a;
                if ((leastStringentArgs === null || leastStringentArgs === void 0 ? void 0 : leastStringentArgs.key) === ((_a = value.args) === null || _a === void 0 ? void 0 : _a.key) && !changedByOpposite) {
                    return;
                }
                if (VariableArgs_1.VariableArgs.contains(value.args, leastStringentArgs)) {
                    value.unlink(entityManager, target);
                }
                else {
                    this.evict(entityManager, value.args);
                }
            });
        }
    }
    forceUnlink(entityManager, target) {
        entityManager.modificationContext.update(this.record);
        this.valueMap.forEachValue(value => {
            value.unlink(entityManager, target);
        });
    }
    appendTo(map) {
        const idFieldName = this.field.targetType.idField.name;
        this.valueMap.forEachValue(value => {
            map.set(VariableArgs_1.VariableArgs.fieldKey(this.field.name, value.args), value.getAsObject());
        });
    }
    dispose(entityManager) {
        this.valueMap.forEachValue(value => {
            value.dispose(entityManager);
        });
    }
    value(entityManager, args) {
        return this.valueMap.computeIfAbsent(args === null || args === void 0 ? void 0 : args.key, () => {
            switch (this.field.category) {
                case "CONNECTION":
                    return new AssociationConnectionValue_1.AssociationConnectionValue(entityManager, this, args);
                case "LIST":
                    return new AssociationListValue_1.AssociationListValue(entityManager, this, args);
                default:
                    return new AssociationReferenceValue_1.AssociationReferenceValue(entityManager, this, args);
            }
        });
    }
}
exports.Association = Association;
