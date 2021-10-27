"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalarRowImpl = exports.objectWithOnlyId = exports.QUERY_OBJECT_ID = exports.Record = void 0;
const SpaceSavingMap_1 = require("../state/impl/SpaceSavingMap");
const Association_1 = require("./assocaition/Association");
const BackReferences_1 = require("./BackReferences");
class Record {
    constructor(staticType, runtimeType, id, deleted = false) {
        this.staticType = staticType;
        this.runtimeType = runtimeType;
        this.id = id;
        this.deleted = deleted;
        this.scalarMap = new Map();
        this.associationMap = new SpaceSavingMap_1.SpaceSavingMap();
        this.backReferences = new BackReferences_1.BackReferences();
        if (staticType.name === 'Mutation') {
            throw new Error(`Cannot create record for type 'Mutation'`);
        }
        if (staticType.name === 'Query') {
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
        if (field.declaringType !== this.staticType) {
            throw new Error(`'${field.fullName}' is not field of the type '${this.staticType.name}' of current record`);
        }
        if (field === null || field === void 0 ? void 0 : field.isAssociation) {
            this
                .associationMap
                .computeIfAbsent(field, f => new Association_1.Association(this, f))
                .set(entityManager, args, value);
        }
        else {
            if ((args === null || args === void 0 ? void 0 : args.variables) !== undefined) {
                throw new Error('scalar fields does not support variables');
            }
            if (field === this.staticType.idField) {
                if (value !== this.id) {
                    throw new Error(`Cannot chanage "${this.staticType.idField.fullName} because its id field"`);
                }
            }
            else {
                const oldValue = this.scalarMap.get(field.name);
                if (oldValue !== value) {
                    this.scalarMap.set(field.name, value);
                    entityManager.modificationContext.set(this, field.name, args, oldValue, value);
                }
            }
        }
    }
    link(entityManager, associationField, record) {
        var _a;
        (_a = this.associationMap.get(associationField)) === null || _a === void 0 ? void 0 : _a.link(entityManager, record, undefined);
    }
    unlink(entityManager, associationField, record) {
        var _a;
        (_a = this.associationMap.get(associationField)) === null || _a === void 0 ? void 0 : _a.unlink(entityManager, record, undefined);
    }
    contains(field, args, target, tryMoreStrictArgs) {
        var _a;
        return ((_a = this.associationMap.get(field)) === null || _a === void 0 ? void 0 : _a.contains(args, target, tryMoreStrictArgs)) === true;
    }
    evict(entityManager, field, args, includeMoreStrictArgs = false) {
        var _a;
        if (field.declaringType !== this.staticType) {
            throw new Error(`'${field.fullName}' is not field of the type '${this.staticType.name}' of current record`);
        }
        if (field.isAssociation) {
            (_a = this.associationMap.get(field)) === null || _a === void 0 ? void 0 : _a.evict(entityManager, args, includeMoreStrictArgs);
        }
        else {
            entityManager.modificationContext.unset(this, field.name, undefined);
            this.scalarMap.delete(field.name);
        }
    }
    delete(entityManager) {
        if (this.deleted) {
            return;
        }
        if (this.staticType.name === 'Query') {
            throw new Error(`The object of special type 'Query' cannot be deleted`);
        }
        this.scalarMap.clear();
        this.disposeAssocaitions(entityManager);
        this.backReferences.forEach((field, _, record) => {
            var _a;
            (_a = record.associationMap.get(field)) === null || _a === void 0 ? void 0 : _a.unlinkAll(entityManager, this);
        });
        this.deleted = true;
    }
    undelete() {
        if (this.deleted) {
            this.deleted = false;
            return true;
        }
        return false;
    }
    toRow() {
        let row = this.row;
        if (row === undefined) {
            this.row = row = new ScalarRowImpl(this.scalarMap);
        }
        return row;
    }
    createMap() {
        const map = new Map();
        for (const [name, value] of this.scalarMap) {
            map.set(name, value);
        }
        this.associationMap.forEachValue(association => {
            association.appendTo(map);
        });
        return map;
    }
    dispose(entityManager) {
        this.disposeAssocaitions(entityManager);
        // Add other behaviors in future
    }
    disposeAssocaitions(entityManager) {
        this.associationMap.forEachValue(assocaition => {
            assocaition.dispose(entityManager);
        });
        this.associationMap.clear();
    }
}
exports.Record = Record;
exports.QUERY_OBJECT_ID = "____QUERY_OBJECT____";
function objectWithOnlyId(record) {
    if (record === undefined) {
        return undefined;
    }
    return record.staticType.createObject(record.id);
}
exports.objectWithOnlyId = objectWithOnlyId;
class ScalarRowImpl {
    constructor(map) {
        this.map = map;
    }
    has(fieldName) {
        return this.map.has(fieldName);
    }
    get(fieldName) {
        const value = this.map.get(fieldName);
        if (value === undefined && !this.map.has(fieldName)) {
            throw new Error(`The field '${fieldName}' is not cached in the scalar row`);
        }
        return value;
    }
    toString() {
        let sperator = "";
        let result = "{ ";
        for (const [k, v] of this.map) {
            if (v !== undefined) {
                result += sperator;
                result += k;
                result += ": ";
                result += JSON.stringify(v);
                sperator = ", ";
            }
        }
        result += " }";
        return result;
    }
}
exports.ScalarRowImpl = ScalarRowImpl;
