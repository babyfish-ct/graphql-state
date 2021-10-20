"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssociationListValue = void 0;
const Record_1 = require("../Record");
const AssocaitionValue_1 = require("./AssocaitionValue");
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
        var _a, _b, _c, _d, _e, _f, _g;
        const association = this.association;
        let listChanged = ((_b = (_a = this.elements) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) !== ((_c = value === null || value === void 0 ? void 0 : value.length) !== null && _c !== void 0 ? _c : 0);
        if (!listChanged) {
            const idFieldName = association.field.targetType.idField.name;
            for (let i = ((_d = value === null || value === void 0 ? void 0 : value.length) !== null && _d !== void 0 ? _d : 0) - 1; i >= 0; --i) {
                const oldId = this.elements !== undefined ?
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
        const oldValueForTriggger = listChanged ? (_f = this.elements) === null || _f === void 0 ? void 0 : _f.map(Record_1.objectWithOnlyId) : undefined;
        const oldMap = Record_1.toRecordMap(this.elements);
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
                }
            }
        }
        for (const [id, element] of oldMap) {
            if (!newIds.has(id)) {
                this.releaseOldReference(entityManager, element);
            }
        }
        this.elements = newElements.length === 0 ? undefined : newElements;
        for (const newElement of newElements) {
            if (newElement !== undefined) {
                if (!oldMap.has(newElement.id)) {
                    this.retainNewReference(entityManager, newElement);
                }
            }
        }
        if (listChanged) {
            entityManager.modificationContext.set(this.association.record, association.field.name, this.args, oldValueForTriggger, (_g = this.elements) === null || _g === void 0 ? void 0 : _g.map(Record_1.objectWithOnlyId));
        }
    }
    link(entityManager, target) {
        var _a, _b;
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const elementMap = Record_1.toRecordMap(elements);
        const linkMap = Record_1.toRecordMap(Array.isArray(target) ? target : [target]);
        for (const record of linkMap.values()) {
            if (!elementMap.has(record.id)) {
                elements.push(record);
            }
        }
        if ((_b = elements.length !== ((_a = this.elements) === null || _a === void 0 ? void 0 : _a.length)) !== null && _b !== void 0 ? _b : 0) {
            this.association.set(entityManager, this.args, elements.map(Record_1.objectWithOnlyId));
        }
    }
    unlink(entityManager, target) {
        var _a, _b;
        const elements = this.elements !== undefined ? [...this.elements] : [];
        const elementMap = Record_1.toRecordMap(elements);
        const unlinkMap = Record_1.toRecordMap(Array.isArray(target) ? target : [target]);
        for (const record of unlinkMap.values()) {
            if (elementMap.has(record.id)) {
                const index = elements.findIndex(element => (element === null || element === void 0 ? void 0 : element.id) === record.id);
                elements.splice(index, 1);
            }
        }
        if ((_b = elements.length !== ((_a = this.elements) === null || _a === void 0 ? void 0 : _a.length)) !== null && _b !== void 0 ? _b : 0) {
            this.association.set(entityManager, this.args, elements.map(Record_1.objectWithOnlyId));
        }
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
