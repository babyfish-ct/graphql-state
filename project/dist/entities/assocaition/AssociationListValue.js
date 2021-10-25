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
        const list = value !== null && value !== void 0 ? value : [];
        this.validate(list);
        if (this.valueEquals(list)) {
            return;
        }
        const oldValueForTriggger = this.getAsObject();
        const oldIndexMap = this.indexMap;
        const association = this.association;
        const newIndexMap = new Map();
        const newElements = [];
        if (Array.isArray(list)) {
            const idFieldName = association.field.targetType.idField.name;
            const position = association.field.associationProperties.position;
            for (let i = 0; i < list.length; i++) {
                const item = list[i];
                if (item === undefined || item === null) {
                    throw new Error(`Cannot add undfined/null element into ${association.field.fullName}`);
                }
                const newElement = entityManager.saveId(association.field.targetType.name, item[idFieldName]);
                if (!newIndexMap.has(newElement.id)) {
                    newElements.push(newElement);
                    newIndexMap.set(newElement.id, i);
                }
            }
        }
        if (this.elements !== undefined) {
            for (const oldElement of this.elements) {
                if (!newIndexMap.has(oldElement.id)) {
                    this.releaseOldReference(entityManager, oldElement);
                }
            }
        }
        this.elements = newElements;
        this.indexMap = newIndexMap.size !== 0 ? newIndexMap : undefined;
        for (const newElement of newElements) {
            if ((oldIndexMap === null || oldIndexMap === void 0 ? void 0 : oldIndexMap.has(newElement.id)) !== true) {
                this.retainNewReference(entityManager, newElement);
            }
        }
        entityManager.modificationContext.set(this.association.record, association.field.name, this.args, oldValueForTriggger, this.getAsObject());
    }
    link(entityManager, targets) {
        var _a, _b;
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const indexMap = this.indexMap;
        const linkMap = util_1.toRecordMap(targets);
        const position = this.association.field.associationProperties.position;
        for (const record of linkMap.values()) {
            if ((indexMap === null || indexMap === void 0 ? void 0 : indexMap.has(record.id)) !== true) {
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
    unlink(entityManager, targets) {
        var _a, _b;
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const indexMap = this.indexMap;
        const unlinkMap = util_1.toRecordMap(targets);
        for (const record of unlinkMap.values()) {
            const index = indexMap === null || indexMap === void 0 ? void 0 : indexMap.get(record.id);
            if (index !== undefined) {
                elements.splice(index, 1);
            }
        }
        if ((_b = elements.length !== ((_a = this.elements) === null || _a === void 0 ? void 0 : _a.length)) !== null && _b !== void 0 ? _b : 0) {
            this.association.set(entityManager, this.args, elements.map(Record_1.objectWithOnlyId));
        }
    }
    contains(target) {
        var _a;
        return ((_a = this.indexMap) === null || _a === void 0 ? void 0 : _a.has(target.id)) === true;
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
        var _a;
        if (this.elements === undefined || this.elements.length !== newList.length) {
            return false;
        }
        const idFieldName = this.association.field.targetType.idField.name;
        for (let i = ((_a = newList === null || newList === void 0 ? void 0 : newList.length) !== null && _a !== void 0 ? _a : 0) - 1; i >= 0; --i) {
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
