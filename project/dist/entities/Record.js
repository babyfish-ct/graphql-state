"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUERY_OBJECT_ID = exports.Record = void 0;
const SpaceSavingMap_1 = require("../state/impl/SpaceSavingMap");
const BackReferences_1 = require("./BackReferences");
const VariableArgs_1 = require("./VariableArgs");
class Record {
    constructor(type, id, deleted = false) {
        this.type = type;
        this.id = id;
        this.deleted = deleted;
        this.scalarMap = new Map();
        this.associationMap = new SpaceSavingMap_1.SpaceSavingMap();
        this.backReferences = new BackReferences_1.BackReferences();
        if (type.name === 'Query') {
            if (id !== exports.QUERY_OBJECT_ID) {
                throw new Error(`The id of query object must be '${exports.QUERY_OBJECT_ID}'`);
            }
            if (deleted) {
                throw new Error(`The object of special type 'Query' cannot be deleted`);
            }
        }
    }
    get isDeleted() {
        return this.deleted;
    }
    hasScalar(fieldName) {
        return this.scalarMap.has(fieldName);
    }
    getSalar(fieldName) {
        return this.scalarMap.get(fieldName);
    }
    hasAssociation(field, args) {
        var _a;
        return ((_a = this.associationMap.get(field)) === null || _a === void 0 ? void 0 : _a.has(args)) === true;
    }
    getAssociation(field, args) {
        var _a;
        return (_a = this.associationMap.get(field)) === null || _a === void 0 ? void 0 : _a.get(args);
    }
    set(entityManager, field, args, value) {
        if (field === null || field === void 0 ? void 0 : field.isAssociation) {
            this
                .associationMap
                .computeIfAbsent(field, f => new Association(f))
                .set(entityManager, this, args, value);
        }
        else {
            if ((args === null || args === void 0 ? void 0 : args.variables) !== undefined) {
                throw new Error('scalar fields does not support variables');
            }
            if (field === this.type.idField) {
                if (value !== this.id) {
                    throw new Error(`Cannot chanage "${this.type.idField.fullName} because its id field"`);
                }
            }
            else {
                const oldValue = this.scalarMap.get(field.name);
                if (oldValue !== value) {
                    this.scalarMap.set(field.name, value);
                    entityManager.modificationContext.set(this, field.name, args === null || args === void 0 ? void 0 : args.key, oldValue, value);
                }
            }
        }
    }
    link(entityManager, associationField, record) {
        var _a;
        (_a = this.associationMap.get(associationField)) === null || _a === void 0 ? void 0 : _a.link(entityManager, this, record, undefined, true);
    }
    unlink(entityManager, associationField, record) {
        var _a;
        (_a = this.associationMap.get(associationField)) === null || _a === void 0 ? void 0 : _a.unlink(entityManager, this, record, undefined, true);
    }
    delete(entityManager) {
        if (this.deleted) {
            return;
        }
        if (this.type.name === 'Query') {
            throw new Error(`The object of special type 'Query' cannot be deleted`);
        }
        this.scalarMap.clear();
        this.associationMap.clear();
        this.backReferences.forEach((field, _, record) => {
            var _a;
            (_a = record.associationMap.get(field)) === null || _a === void 0 ? void 0 : _a.forceUnlink(entityManager, record, this);
        });
        this.deleted = true;
    }
    undelete() {
        this.deleted = false;
    }
}
exports.Record = Record;
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
            throw new Error(`Cannot change the association because its frozen`);
        }
        this.frozen = true;
        try {
            this.value(args).set(entityManager, record, this.field, value);
        }
        finally {
            this.frozen = false;
        }
    }
    evict(args) {
        this.valueMap.remove(args === null || args === void 0 ? void 0 : args.key);
    }
    link(entityManager, self, target, mostStringentArgs, changedByOpposite) {
        if (!this.frozen || !changedByOpposite) {
            entityManager.modificationContext.update(self);
            this.valueMap.forEachValue(value => {
                var _a;
                if ((mostStringentArgs === null || mostStringentArgs === void 0 ? void 0 : mostStringentArgs.key) === ((_a = value.args) === null || _a === void 0 ? void 0 : _a.key) && !changedByOpposite) {
                    return;
                }
                value.link(entityManager, self, this, target, VariableArgs_1.VariableArgs.contains(mostStringentArgs, value.args));
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
                    value.unlink(entityManager, self, this, target, true);
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
            value.unlink(entityManager, self, this, target, true);
        });
    }
    value(args) {
        return this.valueMap.computeIfAbsent(args === null || args === void 0 ? void 0 : args.key, () => {
            switch (this.field.category) {
                case "CONNECTION":
                    return new AssociationConnectionValue(args);
                case "LIST":
                    return new AssociationListValue(args);
                default:
                    return new AssociationReferenceValue(args);
            }
        });
    }
}
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
class AssociationReferenceValue extends AssociationValue {
    get() {
        return this.referfence;
    }
    set(entityManager, self, associationField, value) {
        var _a;
        const reference = value !== undefined && value !== null ?
            entityManager.saveId(associationField.targetType.name, value[associationField.targetType.idField.name]) :
            undefined;
        const oldReference = this.referfence;
        if ((oldReference === null || oldReference === void 0 ? void 0 : oldReference.id) !== (reference === null || reference === void 0 ? void 0 : reference.id)) {
            this.releaseOldReference(entityManager, self, associationField, oldReference);
            this.referfence = reference;
            this.retainNewReference(entityManager, self, associationField, reference);
            entityManager.modificationContext.set(self, associationField.name, (_a = this.args) === null || _a === void 0 ? void 0 : _a.key, objectWithOnlyId(oldReference), objectWithOnlyId(reference));
        }
    }
    link(entityManager, self, association, target, absolute) {
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
            association.set(entityManager, self, this.args, objectWithOnlyId(targetRecord));
        }
    }
    unlink(entityManager, self, association, target, absolute) {
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
class AssociationListValue extends AssociationValue {
    get() {
        var _a;
        return (_a = this.elements) !== null && _a !== void 0 ? _a : [];
    }
    set(entityManager, self, associationField, value) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        let listChanged = ((_b = (_a = this.elements) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) !== ((_c = value === null || value === void 0 ? void 0 : value.length) !== null && _c !== void 0 ? _c : 0);
        if (!listChanged) {
            const idFieldName = associationField.targetType.idField.name;
            for (let i = ((_d = value === null || value === void 0 ? void 0 : value.length) !== null && _d !== void 0 ? _d : 0) - 1; i >= 0; --i) {
                const oldId = this.elements !== undefined && this.elements[i] !== undefined ?
                    (_e = this.elements[i]) === null || _e === void 0 ? void 0 : _e.id :
                    undefined;
                const newId = value[i] !== undefined && value[i] !== null ?
                    value[i][idFieldName] :
                    undefined;
                if (oldId !== newId) {
                    listChanged = true;
                    break;
                }
            }
        }
        const oldValueForTriggger = listChanged ? (_f = this.elements) === null || _f === void 0 ? void 0 : _f.map(objectWithOnlyId) : undefined;
        const oldMap = toRecordMap(this.elements);
        const newIds = new Set();
        const newElements = [];
        if (Array.isArray(value)) {
            const idFieldName = associationField.targetType.idField.name;
            for (const item of value) {
                if (item !== undefined && item !== null) {
                    const newElement = entityManager.saveId(associationField.targetType.name, item[idFieldName]);
                    newIds.add(newElement.id);
                    newElements.push(newElement);
                }
                else {
                    newElements.push(undefined);
                }
            }
        }
        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(entityManager, self, associationField, element);
            }
        }
        this.elements = newElements.length === 0 ? undefined : newElements;
        for (const newElement of newElements) {
            if (newElement !== undefined) {
                if (!oldMap.has(newElement.id)) {
                    this.retainNewReference(entityManager, self, associationField, newElement);
                }
            }
        }
        if (listChanged) {
            entityManager.modificationContext.set(self, associationField.name, (_g = this.args) === null || _g === void 0 ? void 0 : _g.key, oldValueForTriggger, (_h = this.elements) === null || _h === void 0 ? void 0 : _h.map(objectWithOnlyId));
        }
    }
    link(entityManager, self, association, target, absolute) {
        var _a, _b;
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const elementMap = toRecordMap(elements);
        const linkMap = toRecordMap(Array.isArray(target) ? target : [target]);
        for (const record of linkMap.values()) {
            if (!elementMap.has(record.id)) {
                elements.push(record);
            }
        }
        if ((_b = elements.length !== ((_a = this.elements) === null || _a === void 0 ? void 0 : _a.length)) !== null && _b !== void 0 ? _b : 0) {
            association.set(entityManager, self, this.args, elements.map(objectWithOnlyId));
        }
    }
    unlink(entityManager, self, association, target, absolute) {
        var _a, _b;
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const elementMap = toRecordMap(elements);
        const unlinkMap = toRecordMap(Array.isArray(target) ? target : [target]);
        for (const record of unlinkMap.values()) {
            if (elementMap.has(record.id)) {
                const index = elements.findIndex(element => (element === null || element === void 0 ? void 0 : element.id) === record.id);
                elements.splice(index, 1);
            }
        }
        if ((_b = elements.length !== ((_a = this.elements) === null || _a === void 0 ? void 0 : _a.length)) !== null && _b !== void 0 ? _b : 0) {
            association.set(entityManager, self, this.args, elements.map(objectWithOnlyId));
        }
    }
}
class AssociationConnectionValue extends AssociationValue {
    get() {
        return this.connection;
    }
    set(entityManager, record, associationField, value) {
        var _a, _b;
        if (value === undefined) {
            throw Error(`Cannot set the undefined or null value to ${associationField.fullName} because it's connection field`);
        }
        if (!Array.isArray(typeof value.edges)) {
            throw Error(`The connection object of ${associationField.fullName} must have an array field named "edges"`);
        }
        const oldMap = new Map();
        (_b = (_a = this.connection) === null || _a === void 0 ? void 0 : _a.edges) === null || _b === void 0 ? void 0 : _b.forEach(edge => {
            oldMap.set(edge.node.id, edge.node);
        });
        const newIds = new Set();
        const newEdges = [];
        for (const edge of value.edges) {
            if (typeof edge.node !== "object") {
                throw Error(`Each edge of the connection object of ${associationField.fullName} must have an object field named "node"`);
            }
            if (typeof edge.cursor !== "string") {
                throw Error(`Each edge of the connection object of ${associationField.fullName} must have an string field named "cursor"`);
            }
            const newNode = entityManager.saveId(associationField.targetType.name, edge.node.id);
            newEdges.push({
                node: newNode,
                cursor: edge.cursor
            });
        }
        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(entityManager, record, associationField, element);
            }
        }
        this.connection = Object.assign(Object.assign({}, value), { edges: newEdges });
        for (const newEdge of newEdges) {
            if (!oldMap.has(newEdge.node.id)) {
                this.retainNewReference(entityManager, record, associationField, newEdge.node);
            }
        }
        // TODO: Trigger
    }
    link(entityManager, self, association, target, absolute) {
        // TODO: link
    }
    unlink(entityManager, self, association, target, absolute) {
        // TODO: link
    }
}
exports.QUERY_OBJECT_ID = "unique-id-of-qury-object";
function toRecordMap(arr) {
    const map = new Map();
    if (arr !== undefined) {
        for (const element of arr) {
            if (element !== undefined) {
                map.set(element.id, element);
            }
        }
    }
    return map;
}
function objectWithOnlyId(record) {
    if (record === undefined) {
        return undefined;
    }
    return { [record.type.idField.name]: record.id };
}
