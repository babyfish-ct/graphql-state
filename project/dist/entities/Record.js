"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Record = void 0;
const SpaceSavingMap_1 = require("../state/impl/SpaceSavingMap");
const Variables_1 = require("../state/impl/Variables");
const BackReferences_1 = require("./BackReferences");
class Record {
    constructor(type, id) {
        this.type = type;
        this.id = id;
        this.scalarMap = new Map();
        this.associationMap = new SpaceSavingMap_1.SpaceSavingMap();
        this.backReferences = new BackReferences_1.BackReferences();
        this.deleted = false;
    }
    hasScalar(fieldName) {
        return this.scalarMap.has(fieldName);
    }
    getSalar(fieldName) {
        return this.scalarMap.get(fieldName);
    }
    hasAssociation(field, variables) {
        return this.associationMap.get(field) !== undefined;
    }
    getAssociation(field, variables) {
        var _a;
        return (_a = this.associationMap.get(field)) === null || _a === void 0 ? void 0 : _a.get(variables);
    }
    set(ctx, entityManager, fieldName, field, variablesCode, variables, value) {
        if (field === null || field === void 0 ? void 0 : field.isAssociation) {
            this
                .associationMap
                .computeIfAbsent(field, f => new Association(f))
                .set(ctx, entityManager, this, field, variablesCode, variables, value);
        }
        else {
            if (variables !== undefined) {
                throw new Error('scalar fields does not support variables');
            }
            if (fieldName === this.type.idField.name) {
                if (value !== this.id) {
                    throw new Error(`Cannot chanage "${this.type.idField.fullName} because its id field"`);
                }
            }
            else {
                const oldValue = this.scalarMap.get(fieldName);
                if (oldValue !== value) {
                    this.scalarMap.set(fieldName, value);
                    ctx.change(this, fieldName, oldValue, value);
                }
            }
        }
    }
    undeleted() {
        this.deleted = false;
        return this;
    }
    get isDeleted() {
        return this.deleted;
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
    set(ctx, entityManager, record, associationField, variablesCode, variables, value) {
        this.value(variables).set(ctx, entityManager, record, associationField, variablesCode, variables, value);
    }
    valueOrUndefined(variables) {
        const vs = Variables_1.standardizedVariables(variables);
        const vsCode = vs !== undefined ? JSON.stringify(vs) : undefined;
        return this.valueMap.get(vsCode);
    }
    value(variables) {
        const vs = Variables_1.standardizedVariables(variables);
        const vsCode = vs !== undefined ? JSON.stringify(vs) : undefined;
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
}
class AssociationReferenceValue extends AssociationValue {
    get() {
        return this.referfence;
    }
    set(ctx, entityManager, record, associationField, variablesCode, variables, value) {
        var _a, _b;
        if (value === undefined && !associationField.isUndefinable) {
            throw Error(`Cannot set the undefined or null value to ${associationField.fullName} because it's not undefinable`);
        }
        const oldReference = this.referfence;
        const reference = value !== undefined ?
            entityManager.saveId(ctx, associationField.targetType.name, value.id) :
            undefined;
        if (oldReference !== reference) {
            (_a = oldReference === null || oldReference === void 0 ? void 0 : oldReference.backReferences) === null || _a === void 0 ? void 0 : _a.remove(associationField, variablesCode, record);
            this.referfence = reference;
            (_b = reference === null || reference === void 0 ? void 0 : reference.backReferences) === null || _b === void 0 ? void 0 : _b.add(associationField, variablesCode, variables, record);
            ctx.change(record, associationField.name, objectWithOnlyId(oldReference), objectWithOnlyId(reference));
        }
    }
}
class AssociationListValue extends AssociationValue {
    get() {
        return this.elements;
    }
    set(ctx, entityManager, record, associationField, variablesCode, variables, value) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        let listChanged = ((_b = (_a = this.elements) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) !== ((_c = value === null || value === void 0 ? void 0 : value.length) !== null && _c !== void 0 ? _c : 0);
        if (!listChanged) {
            const idFieldName = record.type.idField.name;
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
                    const newElement = entityManager.saveId(ctx, associationField.targetType.name, item.id);
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
                element.backReferences.remove(associationField, variablesCode, record);
            }
        }
        this.elements = newElements.length === 0 ? undefined : newElements;
        for (const newElement of newElements) {
            if (newElement !== undefined) {
                if (!oldMap.has(newElement.id)) {
                    newElement.backReferences.add(associationField, variablesCode, variables, record);
                }
            }
        }
        if (listChanged) {
            ctx.change(record, associationField.name, oldValueForTriggger, (_h = this.elements) === null || _h === void 0 ? void 0 : _h.map(objectWithOnlyId));
        }
    }
}
class AssociationConnectionValue extends AssociationValue {
    get() {
        return this.connection;
    }
    set(ctx, entityManager, record, associationField, variablesCode, variables, value) {
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
            const newNode = entityManager.saveId(ctx, associationField.targetType.name, edge.node.id);
            newEdges.push({
                node: newNode,
                cursor: edge.cursor
            });
        }
        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                element.backReferences.remove(associationField, variablesCode, record);
            }
        }
        this.connection = Object.assign(Object.assign({}, value), { edges: newEdges });
        for (const newEdge of newEdges) {
            if (!oldMap.has(newEdge.node.id)) {
                newEdge.node.backReferences.add(associationField, variablesCode, variables, record);
            }
        }
        // TODO: Trigger
    }
}
function objectWithOnlyId(record) {
    if (record === undefined) {
        return undefined;
    }
    return { [record.type.idField.name]: record.id };
}
