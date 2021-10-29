"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Association = void 0;
const SpaceSavingMap_1 = require("../../state/impl/SpaceSavingMap");
const Args_1 = require("../../state/impl/Args");
const AssociationConnectionValue_1 = require("./AssociationConnectionValue");
const AssociationListValue_1 = require("./AssociationListValue");
const AssociationReferenceValue_1 = require("./AssociationReferenceValue");
class Association {
    constructor(record, field) {
        this.record = record;
        this.field = field;
        this.valueMap = new SpaceSavingMap_1.SpaceSavingMap();
        this.linkChanging = false;
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
        this.value(entityManager, args).set(entityManager, value);
    }
    evict(entityManager, args, includeMoreStrictArgs) {
        const ctx = entityManager.modificationContext;
        if (includeMoreStrictArgs) {
            const keys = [];
            this.valueMap.forEachValue(value => {
                if (Args_1.VariableArgs.contains(value.args, args)) {
                    ctx.unset(this.record, this.field.name, value.args);
                    value.dispose(entityManager);
                    keys.push(args === null || args === void 0 ? void 0 : args.key);
                }
            });
            for (const key of keys) {
                this.valueMap.remove(key);
            }
        }
        else {
            const value = this.valueMap.get(args === null || args === void 0 ? void 0 : args.key);
            if (value !== undefined) {
                ctx.unset(this.record, this.field.name, value.args);
                value.dispose(entityManager);
                this.valueMap.remove(args === null || args === void 0 ? void 0 : args.key);
            }
        }
    }
    contains(args, target, tryMoreStrictArgs) {
        var _a;
        if (!tryMoreStrictArgs) {
            return ((_a = this.valueMap.get(args === null || args === void 0 ? void 0 : args.key)) === null || _a === void 0 ? void 0 : _a.contains(target)) === true;
        }
        let result = false;
        this.valueMap.forEachValue(value => {
            if (Args_1.VariableArgs.contains(value.args, args)) {
                if (value.contains(target)) {
                    result = true;
                    return false;
                }
            }
        });
        return result;
    }
    link(entityManager, target, mostStringentArgs, insideModification = false) {
        this.changeLinks(() => {
            this.valueMap.forEachValue(value => {
                var _a, _b;
                if (insideModification && (mostStringentArgs === null || mostStringentArgs === void 0 ? void 0 : mostStringentArgs.key) === ((_a = value.args) === null || _a === void 0 ? void 0 : _a.key)) {
                    return;
                }
                const possibleRecords = (Array.isArray(target) ? target : [target])
                    .filter(target => !value.contains(target));
                if (possibleRecords.length === 0) {
                    return;
                }
                if (Args_1.VariableArgs.contains(mostStringentArgs, value.args)) {
                    value.link(entityManager, possibleRecords);
                }
                else {
                    const contains = this.field.associationProperties.contains;
                    const exactRecords = [];
                    let evict = false;
                    for (const possibleRecord of possibleRecords) {
                        const result = contains(possibleRecord.toRow(), (_b = value.args) === null || _b === void 0 ? void 0 : _b.variables);
                        if (result === undefined) {
                            evict = true;
                            break;
                        }
                        if (result === true) {
                            exactRecords.push(possibleRecord);
                        }
                    }
                    if (evict) {
                        this.evict(entityManager, value.args, false);
                    }
                    else if (exactRecords.length !== 0) {
                        value.link(entityManager, exactRecords);
                    }
                }
            });
        });
    }
    unlink(entityManager, target, leastStringentArgs, insideModification = false) {
        this.changeLinks(() => {
            this.valueMap.forEachValue(value => {
                var _a, _b;
                if (insideModification && (leastStringentArgs === null || leastStringentArgs === void 0 ? void 0 : leastStringentArgs.key) === ((_a = value.args) === null || _a === void 0 ? void 0 : _a.key)) {
                    return;
                }
                const possibleRecords = (Array.isArray(target) ? target : [target])
                    .filter(target => value.contains(target));
                if (possibleRecords.length === 0) {
                    return;
                }
                if (Args_1.VariableArgs.contains(value.args, leastStringentArgs)) {
                    value.unlink(entityManager, possibleRecords);
                }
                else {
                    const contains = this.field.associationProperties.contains;
                    const exactRecords = [];
                    let evict = false;
                    for (const possibleRecord of possibleRecords) {
                        const result = contains(possibleRecord.toRow(), (_b = value.args) === null || _b === void 0 ? void 0 : _b.variables);
                        if (result === undefined) {
                            evict = true;
                            break;
                        }
                        if (result === false) {
                            exactRecords.push(possibleRecord);
                        }
                    }
                    if (evict) {
                        this.evict(entityManager, value.args, false);
                    }
                    else if (exactRecords.length !== 0) {
                        value.unlink(entityManager, exactRecords);
                    }
                }
            });
        });
    }
    unlinkAll(entityManager, target) {
        this.changeLinks(() => {
            this.valueMap.forEachValue(value => {
                value.unlink(entityManager, [target]);
            });
        });
    }
    appendTo(map) {
        const idFieldName = this.field.targetType.idField.name;
        this.valueMap.forEachValue(value => {
            map.set(Args_1.VariableArgs.fieldKey(this.field.name, value.args), value.getAsObject());
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
    changeLinks(action) {
        if (this.linkChanging) {
            return;
        }
        this.linkChanging = true;
        try {
            action();
        }
        finally {
            this.linkChanging = false;
        }
    }
    gcVisit(args) {
        const value = this.valueMap.get(args === null || args === void 0 ? void 0 : args.key);
        if (value !== undefined) {
            value.gcVisited = true;
        }
    }
    collectGarbages(output) {
        this.valueMap.forEachValue(value => {
            if (value.gcVisited) {
                value.gcVisited = false;
            }
            else {
                output.push({ record: this.record, field: this.field, args: value.args });
            }
        });
    }
}
exports.Association = Association;
