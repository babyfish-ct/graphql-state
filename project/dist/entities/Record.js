"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUERY_OBJECT_ID = exports.Record = void 0;
const SpaceSavingMap_1 = require("../state/impl/SpaceSavingMap");
const Variables_1 = require("../state/impl/Variables");
const BackReferences_1 = require("./BackReferences");
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
    hasScalar(fieldName) {
        return this.scalarMap.has(fieldName);
    }
    getSalar(fieldName) {
        return this.scalarMap.get(fieldName);
    }
    hasAssociation(field, variables) {
        var _a;
        return ((_a = this.associationMap.get(field)) === null || _a === void 0 ? void 0 : _a.has(variables)) === true;
    }
    getAssociation(field, variables) {
        var _a;
        return (_a = this.associationMap.get(field)) === null || _a === void 0 ? void 0 : _a.get(variables);
    }
    set(entityManager, field, variablesCode, variables, value) {
        if (field === null || field === void 0 ? void 0 : field.isAssociation) {
            this
                .associationMap
                .computeIfAbsent(field, f => new Association(f))
                .set(entityManager, this, field, variablesCode, variables, value);
        }
        else {
            if (variables !== undefined) {
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
                    entityManager.modificationContext.set(this, field.name, variablesCode, oldValue, value);
                }
            }
        }
    }
    get isDeleted() {
        return this.deleted;
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
            record.unlink(entityManager, field, this);
        });
        this.deleted = true;
    }
    undelete() {
        this.deleted = false;
    }
    link(entityManager, associationField, target) {
        this.associationMap.forEachValue(association => {
            if (association.field === associationField) {
                entityManager.modificationContext.update(this);
                association.link(entityManager, this, target);
            }
        });
    }
    unlink(entityManager, associationField, target) {
        this.associationMap.forEachValue(association => {
            if (association.field === associationField) {
                entityManager.modificationContext.update(this);
                association.unlink(entityManager, this, target);
            }
        });
    }
}
exports.Record = Record;
class Association {
    constructor(field) {
        this.field = field;
        this.valueMap = new SpaceSavingMap_1.SpaceSavingMap();
        if (field.category === "ID") {
            throw new Error("Internal bug: assocaition base on id field");
        }
    }
    has(variables) {
        return this.valueOrUndefined(variables) !== undefined;
    }
    get(variables) {
        var _a;
        return (_a = this.valueOrUndefined(variables)) === null || _a === void 0 ? void 0 : _a.get();
    }
    set(entityManager, record, associationField, variablesCode, variables, value) {
        this.value(variables).set(entityManager, record, associationField, variablesCode, variables, value);
    }
    link(entityManager, self, target) {
        this.valueMap.forEach((vsCode, value) => {
            value.link(entityManager, self, this.field, vsCode, target);
        });
    }
    unlink(entityManager, self, target) {
        this.valueMap.forEach((vsCode, value) => {
            value.unlink(entityManager, self, this.field, vsCode, target);
        });
    }
    valueOrUndefined(variables) {
        const vs = Variables_1.standardizedVariables(variables);
        const vsCode = vs !== undefined ? JSON.stringify(vs) : undefined;
        return this.valueMap.get(vsCode);
    }
    value(variables) {
        const vs = Variables_1.standardizedVariables(variables);
        const vsCode = JSON.stringify(vs);
        return this.valueMap.computeIfAbsent(vsCode, () => {
            switch (this.field.category) {
                case "CONNECTION":
                    return new AssociationConnectionValue();
                case "LIST":
                    return new AssociationListValue();
                default:
                    return new AssociationReferenceValue();
            }
        });
    }
}
class AssociationValue {
    constructor() {
        this.linkFrozen = false;
    }
    link(entityManager, self, associationField, variablesCode, target) {
        if (!this.linkFrozen) {
            this.linkFrozen = true;
            try {
                this.onLink(entityManager, self, associationField, variablesCode, target);
            }
            finally {
                this.linkFrozen = false;
            }
        }
    }
    unlink(entityManager, self, associationField, variablesCode, target) {
        if (!this.linkFrozen) {
            this.linkFrozen = true;
            try {
                this.onUnlink(entityManager, self, associationField, variablesCode, target);
            }
            finally {
                this.linkFrozen = false;
            }
        }
    }
    releaseOldReference(entityManager, self, associationField, variablesCode, oldRefernce) {
        if (oldRefernce !== undefined) {
            oldRefernce.backReferences.remove(associationField, variablesCode, self);
            const oppositeField = associationField.oppositeField;
            if (oppositeField !== undefined) {
                if (oldRefernce)
                    oldRefernce.unlink(entityManager, oppositeField, self);
            }
        }
    }
    retainNewReference(entityManager, self, associationField, variablesCode, variables, newReference) {
        if (newReference !== undefined) {
            newReference.backReferences.add(associationField, variablesCode, variables, self);
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
    set(entityManager, self, associationField, variablesCode, variables, value) {
        const reference = value !== undefined ?
            entityManager.saveId(associationField.targetType.name, value[associationField.targetType.idField.name]) :
            undefined;
        const oldReference = this.referfence;
        if (oldReference !== reference) {
            this.releaseOldReference(entityManager, self, associationField, variablesCode, oldReference);
            this.referfence = reference;
            this.retainNewReference(entityManager, self, associationField, variablesCode, variables, reference);
            entityManager.modificationContext.set(self, associationField.name, variablesCode, objectWithOnlyId(oldReference), objectWithOnlyId(reference));
        }
    }
    onLink(entityManager, self, associationField, variablesCode, target) {
        var _a;
        if (((_a = this.referfence) === null || _a === void 0 ? void 0 : _a.id) !== target.id) {
            const variables = variablesCode !== undefined ? JSON.parse(variablesCode) : undefined;
            this.set(entityManager, self, associationField, variablesCode, variables, { [associationField.targetType.idField.name]: target.id });
        }
    }
    onUnlink(entityManager, self, associationField, variablesCode, target) {
        var _a;
        if (((_a = this.referfence) === null || _a === void 0 ? void 0 : _a.id) === target.id) {
            const variables = variablesCode !== undefined ? JSON.parse(variablesCode) : undefined;
            this.set(entityManager, self, associationField, variablesCode, variables, undefined);
        }
    }
}
class AssociationListValue extends AssociationValue {
    get() {
        var _a;
        return (_a = this.elements) !== null && _a !== void 0 ? _a : [];
    }
    set(entityManager, self, associationField, variablesCode, variables, value) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        let listChanged = ((_b = (_a = this.elements) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) !== ((_c = value === null || value === void 0 ? void 0 : value.length) !== null && _c !== void 0 ? _c : 0);
        if (!listChanged) {
            const idFieldName = self.type.idField.name;
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
        const oldMap = new Map();
        (_g = this.elements) === null || _g === void 0 ? void 0 : _g.forEach(element => {
            if (element !== undefined) {
                oldMap.set(element.id, element);
            }
        });
        const newIds = new Set();
        const newElements = [];
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item !== undefined && item !== null) {
                    const newElement = entityManager.saveId(associationField.targetType.name, item.id);
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
                this.releaseOldReference(entityManager, self, associationField, variablesCode, element);
            }
        }
        this.elements = newElements.length === 0 ? undefined : newElements;
        for (const newElement of newElements) {
            if (newElement !== undefined) {
                if (!oldMap.has(newElement.id)) {
                    this.retainNewReference(entityManager, self, associationField, variablesCode, variables, newElement);
                }
            }
        }
        if (listChanged) {
            entityManager.modificationContext.set(self, associationField.name, variablesCode, oldValueForTriggger, (_h = this.elements) === null || _h === void 0 ? void 0 : _h.map(objectWithOnlyId));
        }
    }
    onLink(entityManager, self, associationField, variablesCode, target) {
        var _a, _b;
        if (this.elements !== undefined) {
            for (const element of this.elements) {
                if ((element === null || element === void 0 ? void 0 : element.id) === target.id) {
                    return;
                }
            }
        }
        const variables = variablesCode !== undefined ? JSON.parse(variablesCode) : undefined;
        const idFieldName = associationField.targetType.idField.name;
        const list = (_b = (_a = this.elements) === null || _a === void 0 ? void 0 : _a.map(element => {
            if (element === undefined) {
                return undefined;
            }
            return { [idFieldName]: element.id };
        })) !== null && _b !== void 0 ? _b : [];
        list.push({ [idFieldName]: target.id });
        this.set(entityManager, self, associationField, variablesCode, variables, list);
    }
    onUnlink(entityManager, self, associationField, variablesCode, target) {
        var _a, _b, _c;
        let index = -1;
        if (this.elements !== undefined) {
            for (let i = this.elements.length - 1; i >= 0; --i) {
                if (((_a = this.elements[i]) === null || _a === void 0 ? void 0 : _a.id) === target.id) {
                    index = i;
                    break;
                }
            }
        }
        if (index === -1) {
            return;
        }
        const variables = variablesCode !== undefined ? JSON.parse(variablesCode) : undefined;
        const idFieldName = associationField.targetType.idField.name;
        const list = (_c = (_b = this.elements) === null || _b === void 0 ? void 0 : _b.map(element => {
            if (element === undefined) {
                return undefined;
            }
            return { [idFieldName]: element.id };
        })) !== null && _c !== void 0 ? _c : [];
        list.splice(index, 1);
        this.set(entityManager, self, associationField, variablesCode, variables, list);
    }
}
class AssociationConnectionValue extends AssociationValue {
    get() {
        return this.connection;
    }
    set(entityManager, record, associationField, variablesCode, variables, value) {
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
                this.releaseOldReference(entityManager, record, associationField, variablesCode, element);
            }
        }
        this.connection = Object.assign(Object.assign({}, value), { edges: newEdges });
        for (const newEdge of newEdges) {
            if (!oldMap.has(newEdge.node.id)) {
                this.retainNewReference(entityManager, record, associationField, variablesCode, variables, newEdge.node);
            }
        }
        // TODO: Trigger
    }
    onLink(entityManager, self, associationField, variablesCode, target) {
        // TODO: link
    }
    onUnlink(entityManager, self, associationField, variablesCode, target) {
        // TODO: unlink
    }
}
function objectWithOnlyId(record) {
    if (record === undefined) {
        return undefined;
    }
    return { [record.type.idField.name]: record.id };
}
exports.QUERY_OBJECT_ID = "unique-id-of-qury-object";
