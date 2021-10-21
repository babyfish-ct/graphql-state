"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationListValue = void 0;
const Record_1 = require("../Record");
const AssocaitionValue_1 = require("./AssocaitionValue");
const util_1 = require("./util");
class AssociationListValue extends AssocaitionValue_1.AssociationValue {
    getAsObject() {
        var _a;
        return (_a = this.elements) === null || _a === void 0 ? void 0 : _a.map(Record_1.objectWithOnlyId);
    }
    get() {
        var _a;
        return (_a = this.elements) !== null && _a !== void 0 ? _a : [];
    }
    set(entityManager, value) {
        var _a;
        this.validate(value);
        if (this.valueEquals(value)) {
            return;
        }
        const oldValueForTriggger = this.getAsObject();
        const oldMap = new Map();
        (_a = this.elements) === null || _a === void 0 ? void 0 : _a.map(element => {
            oldMap.set(element.id, element);
        });
        const association = this.association;
        const newIds = new Set();
        const newElements = [];
        if (Array.isArray(value)) {
            const idFieldName = association.field.targetType.idField.name;
            const position = association.field.associationProperties.position;
            for (const item of value) {
                if (item === undefined || item === null) {
                    throw new Error(`Cannot add undfined/null element into ${association.field.fullName}`);
                }
                const newElement = entityManager.saveId(association.field.targetType.name, item[idFieldName]);
                newIds.add(newElement.id);
                try {
                    appendTo(newElements, newElement, position);
                }
                catch (ex) {
                    if (!ex[" $evict"]) {
                        throw ex;
                    }
                    this.evict(entityManager);
                    return;
                }
            }
        }
        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(entityManager, element);
            }
        }
        this.elements = newElements.length === 0 ? undefined : newElements;
        this.ids = newIds;
        for (const newElement of newElements) {
            if (!oldMap.has(newElement.id)) {
                this.retainNewReference(entityManager, newElement);
            }
        }
        entityManager.modificationContext.set(this.association.record, association.field.name, this.args, oldValueForTriggger, this.getAsObject());
    }
    link(entityManager, target) {
        var _a, _b;
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const elementMap = util_1.toRecordMap(elements);
        const linkMap = util_1.toRecordMap(Array.isArray(target) ? target : [target]);
        const position = this.association.field.associationProperties.position;
        for (const record of linkMap.values()) {
            if (!elementMap.has(record.id)) {
                try {
                    appendTo(elements, record, position);
                }
                catch (ex) {
                    if (!ex[" $evict"]) {
                        throw ex;
                    }
                    this.evict(entityManager);
                    return;
                }
            }
        }
        if ((_b = elements.length !== ((_a = this.elements) === null || _a === void 0 ? void 0 : _a.length)) !== null && _b !== void 0 ? _b : 0) {
            this.association.set(entityManager, this.args, elements.map(Record_1.objectWithOnlyId));
        }
    }
    unlink(entityManager, target) {
        var _a, _b;
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const elementMap = util_1.toRecordMap(elements);
        const unlinkMap = util_1.toRecordMap(Array.isArray(target) ? target : [target]);
        for (const record of unlinkMap.values()) {
            if (elementMap.has(record.id)) {
                const index = elements.findIndex(element => element.id === record.id);
                elements.splice(index, 1);
            }
        }
        if ((_b = elements.length !== ((_a = this.elements) === null || _a === void 0 ? void 0 : _a.length)) !== null && _b !== void 0 ? _b : 0) {
            this.association.set(entityManager, this.args, elements.map(Record_1.objectWithOnlyId));
        }
    }
    contains(target) {
        var _a;
        return ((_a = this.ids) === null || _a === void 0 ? void 0 : _a.has(target.id)) === true;
    }
    validate(newList) {
        if (newList !== undefined && newList !== null) {
            if (!Array.isArray(newList)) {
                throw new Error(`The assocaition ${this.association.field.fullName} can only accept array`);
            }
            const idFieldName = this.association.field.targetType.idField.name;
            for (const element of newList) {
                if (element === undefined) {
                    throw new Error(`The element of the array "${this.association.field.fullName}" cannot be undefined or null`);
                }
                if (element[idFieldName] === undefined || element[idFieldName] === null) {
                    throw new Error(`The element of the array "${this.association.field.fullName}" must support id field "${idFieldName}"`);
                }
            }
        }
    }
    valueEquals(newList) {
        var _a, _b, _c, _d;
        if (((_b = (_a = this.elements) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) !== ((_c = newList === null || newList === void 0 ? void 0 : newList.length) !== null && _c !== void 0 ? _c : 0)) {
            return false;
        }
        const idFieldName = this.association.field.targetType.idField.name;
        for (let i = ((_d = newList === null || newList === void 0 ? void 0 : newList.length) !== null && _d !== void 0 ? _d : 0) - 1; i >= 0; --i) {
            const oldId = this.elements !== undefined ?
                this.elements[i].id :
                undefined;
            const newId = newList !== undefined ?
                newList[i][idFieldName] :
                undefined;
            if (oldId !== newId) {
                return false;
            }
        }
        return true;
    }
}
exports.AssociationListValue = AssociationListValue;
function appendTo(newElements, newElement, position) {
    var _a;
    const pos = newElements.length === 0 ?
        0 :
        position(newElement.toRow(), newElements.map(e => e.toRow()), (_a = this.args) === null || _a === void 0 ? void 0 : _a.variables);
    if (pos === undefined) {
        throw { " $evict": true };
    }
    const index = pos === "start" ? 0 : pos === "end" ? newElements.length : pos;
    if (index >= newElements.length) {
        newElements.push(newElement);
    }
    else {
        newElements.splice(Math.max(0, index), 0, newElement);
    }
}
