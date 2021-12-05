"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Association = void 0;
const SpaceSavingMap_1 = require("../../state/impl/SpaceSavingMap");
const Args_1 = require("../../state/impl/Args");
const AssociationConnectionValue_1 = require("./AssociationConnectionValue");
const AssociationListValue_1 = require("./AssociationListValue");
const AssociationReferenceValue_1 = require("./AssociationReferenceValue");
const util_1 = require("../../state/impl/util");
class Association {
    constructor(record, field) {
        this.record = record;
        this.field = field;
        this.valueMap = new SpaceSavingMap_1.SpaceSavingMap();
        this.linkChanging = false;
        this.refreshedVersion = 0;
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
    anyValueContains(target) {
        let result = false;
        this.valueMap.forEachValue(value => {
            if (value.contains(target)) {
                result = true;
                return false;
            }
        });
        if (result) {
            return true;
        }
        return this.valueMap.get(undefined) !== undefined ? false : undefined;
    }
    set(entityManager, args, value, pagination) {
        this.refreshedVersion = entityManager.modificationVersion;
        this.value(args).set(entityManager, value, pagination);
    }
    evict(entityManager, args, includeMoreStrictArgs) {
        this.refreshedVersion = entityManager.modificationVersion;
        const ctx = entityManager.modificationContext;
        if (includeMoreStrictArgs) {
            const keys = [];
            this.valueMap.forEachValue(value => {
                if (Args_1.VariableArgs.contains(value.args, args)) {
                    ctx.unset(this.record, this.field.name, value.args);
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
                this.valueMap.remove(args === null || args === void 0 ? void 0 : args.key);
            }
        }
    }
    link(entityManager, target, mostStringentArgs, insideModification = false) {
        this.refreshedVersion = entityManager.modificationVersion;
        this.changeLinks(() => {
            var _a, _b, _c;
            for (const value of this.valueMap.cloneValues()) {
                if (insideModification && (mostStringentArgs === null || mostStringentArgs === void 0 ? void 0 : mostStringentArgs.key) === ((_a = value.args) === null || _a === void 0 ? void 0 : _a.key)) {
                    return;
                }
                const possibleRecords = (Array.isArray(target) ? target : [target])
                    .filter(target => !value.contains(target));
                if (possibleRecords.length === 0) {
                    return;
                }
                if (!value.isLinkOptimizable) {
                    this.evict(entityManager, value.args, false);
                }
                else if (Args_1.VariableArgs.contains(mostStringentArgs === null || mostStringentArgs === void 0 ? void 0 : mostStringentArgs.filterArgs, (_b = value.args) === null || _b === void 0 ? void 0 : _b.filterArgs)) {
                    value.link(entityManager, possibleRecords);
                }
                else {
                    const contains = this.field.associationProperties.contains;
                    const exactRecords = [];
                    let evict = false;
                    for (const possibleRecord of possibleRecords) {
                        const result = contains(possibleRecord.toRow(), (_c = value.args) === null || _c === void 0 ? void 0 : _c.filterVariables);
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
            }
        });
    }
    unlink(entityManager, target, leastStringentArgs, insideModification = false) {
        this.refreshedVersion = entityManager.modificationVersion;
        this.changeLinks(() => {
            var _a, _b, _c;
            for (const value of this.valueMap.cloneValues()) {
                if (insideModification && (leastStringentArgs === null || leastStringentArgs === void 0 ? void 0 : leastStringentArgs.key) === ((_a = value.args) === null || _a === void 0 ? void 0 : _a.key)) {
                    return;
                }
                const possibleRecords = (Array.isArray(target) ? target : [target])
                    .filter(target => value.contains(target));
                if (possibleRecords.length === 0) {
                    return;
                }
                if (!value.isLinkOptimizable) {
                    this.evict(entityManager, value.args, false);
                }
                else if (Args_1.VariableArgs.contains((_b = value.args) === null || _b === void 0 ? void 0 : _b.filterArgs, leastStringentArgs === null || leastStringentArgs === void 0 ? void 0 : leastStringentArgs.filterArgs)) {
                    value.unlink(entityManager, possibleRecords);
                }
                else {
                    const contains = this.field.associationProperties.contains;
                    const exactRecords = [];
                    let evict = false;
                    for (const possibleRecord of possibleRecords) {
                        const result = contains(possibleRecord.toRow(), (_c = value.args) === null || _c === void 0 ? void 0 : _c.filterVariables);
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
            }
        });
    }
    unlinkAll(entityManager, target) {
        this.refreshedVersion = entityManager.modificationVersion;
        this.changeLinks(() => {
            for (const value of this.valueMap.cloneValues()) {
                value.unlink(entityManager, [target]);
            }
        });
    }
    appendTo(map) {
        this.valueMap.forEachValue(value => {
            map.set(Args_1.VariableArgs.fieldKey(this.field.name, value.args), value.getAsObject());
        });
    }
    value(args) {
        return this.valueMap.computeIfAbsent(args === null || args === void 0 ? void 0 : args.key, () => {
            switch (this.field.category) {
                case "CONNECTION":
                    return new AssociationConnectionValue_1.AssociationConnectionValue(this, args);
                case "LIST":
                    return new AssociationListValue_1.AssociationListValue(this, args);
                default:
                    return new AssociationReferenceValue_1.AssociationReferenceValue(this, args);
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
    refresh(entityManager, event) {
        if (this.refreshedVersion !== entityManager.modificationVersion) {
            this.refreshedVersion = entityManager.modificationVersion;
            for (const value of this.valueMap.cloneValues()) {
                value.referesh(entityManager, event);
            }
        }
    }
    writeTo(writer) {
        this.valueMap.forEachValue(value => {
            writer.seperator();
            writer.text('"');
            writer.text(value.association.field.name);
            if (value.args !== undefined) {
                writer.text(":");
                writer.text(JSON.stringify(value.args));
            }
            writer.text('": ');
            writer.text(JSON.stringify(value.getAsObject()));
        });
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
    monitor() {
        var _a;
        let value = undefined;
        let parameterizedValues;
        if (this.field.isParameterized) {
            const arr = [];
            this.valueMap.forEach((k, v) => {
                arr.push({
                    parameter: k !== null && k !== void 0 ? k : "",
                    value: this.convertMonitorValue(v.get())
                });
            });
            arr.sort((a, b) => util_1.compare(a, b, "parameter"));
            parameterizedValues = arr;
        }
        else {
            value = this.convertMonitorValue((_a = this.valueMap.get(undefined)) === null || _a === void 0 ? void 0 : _a.get());
        }
        const field = {
            name: this.field.name,
            value,
            parameterizedValues
        };
        return field;
    }
    convertMonitorValue(value) {
        if (value === undefined) {
            return undefined;
        }
        if (this.field.category === "LIST") {
            return value.map((element) => element.id);
        }
        if (this.field.category === "CONNECTION") {
            const conn = value;
            return Object.assign({ edeges: conn.edges.map(edge => {
                    return Object.assign(Object.assign({}, edge), { node: edge.node.id });
                }) }, conn);
        }
        return value.id;
    }
}
exports.Association = Association;
