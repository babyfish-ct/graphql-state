"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeMetadata = void 0;
const FieldMetadata_1 = require("./FieldMetadata");
class TypeMetadata {
    constructor(schema, fetchableType) {
        this.schema = schema;
        this._derivedTypes = new Set();
        this._declaredFieldMap = new Map();
        this._fieldMap = undefined;
        this._backRefFields = [];
        this.name = fetchableType.name;
        this.category = fetchableType.category;
        switch (fetchableType.superTypes.length) {
            case 0:
                this._superType = undefined;
                break;
            case 1:
                if (fetchableType.category !== 'OBJECT') {
                    throw new Error(`The non-object type ${fetchableType.name} cannot accept super type`);
                }
                if (fetchableType.superTypes[0].category !== 'OBJECT') {
                    throw new Error(`The type ${fetchableType.name} cannot accept super type ${fetchableType.superTypes[0].name} because that super class is not object type`);
                }
                this._superType = fetchableType.superTypes[0].name;
                break;
            default:
                throw new Error(`graph-state does not support mutliple inheritance but the type "${fetchableType.name}" has ${fetchableType.superTypes.length} super types`);
        }
        for (const [, field] of fetchableType.declaredFields) {
            this.addField(field);
        }
        if (fetchableType.name === "Query") {
            this._idField = new FieldMetadata_1.FieldMetadata(this, {
                name: "__queryObjectId",
                category: "ID",
                argGraphQLTypeMap: new Map(),
                isPlural: false,
                isAssociation: false,
                isFunction: false,
                isUndefinable: false
            });
        }
        else if (fetchableType.name === "Mutation") {
            this._idField = new FieldMetadata_1.FieldMetadata(this, {
                name: "__mutationObjectId",
                category: "ID",
                argGraphQLTypeMap: new Map(),
                isPlural: false,
                isAssociation: false,
                isFunction: false,
                isUndefinable: false
            });
        }
    }
    get superType() {
        let superType = this._superType;
        if (typeof superType === "string") {
            const superMetadata = this.schema.typeMap.get(superType);
            if (superMetadata === undefined) {
                throw new Error(`Illegal type "${this.name}" becasue its super type "${superType}" is not exists`);
            }
            const cycle = [this.name];
            for (let meta = superMetadata; meta !== undefined; meta = meta.superType) {
                cycle.push(meta.name);
                if (cycle[0] === meta.name) {
                    throw new Error(`Super type reference cycle: ${cycle.map(name => `"${name}"`).join(" -> ")}`);
                }
            }
            this._superType = superType = superMetadata;
        }
        return superType;
    }
    get derivedType() {
        let set = this._derivedTypes;
        if (set !== undefined) {
            set = new Set();
            this._derivedTypes = set;
        }
        return set;
    }
    get rootType() {
        var _a, _b;
        let rootMetadata = this._rootType;
        if (rootMetadata === undefined) {
            this._rootType = rootMetadata = (_b = (_a = this.superType) === null || _a === void 0 ? void 0 : _a.rootType) !== null && _b !== void 0 ? _b : this;
        }
        return rootMetadata;
    }
    get declaredFieldMap() {
        return this._declaredFieldMap;
    }
    get fieldMap() {
        let fieldMap = this._fieldMap;
        if (fieldMap === undefined) {
            const superType = this.superType;
            if (superType === undefined) {
                this._fieldMap = fieldMap = this._declaredFieldMap;
            }
            else {
                fieldMap = new Map(superType.fieldMap);
                for (const [name, field] of this._declaredFieldMap) {
                    const baseField = fieldMap.get(name);
                    if (baseField !== undefined) {
                        throw new Error(`The field "${field.fullName}" overrides "${baseField.fullName}", overridden is forbidden`);
                    }
                    fieldMap.set(name, field);
                }
                this._fieldMap = fieldMap;
            }
        }
        return fieldMap;
    }
    get idField() {
        let field = this._idField;
        if (field === undefined) {
            if (this.superType !== undefined) {
                field = this.superType.idField;
            }
            else {
                throw new Error(`There is no id field in the type "${this.name}"`);
            }
            this._idField = field;
        }
        return field;
    }
    isAssignableFrom(type) {
        for (let t = type; t !== undefined; t = t.superType) {
            if (this === t) {
                return true;
            }
        }
        return false;
    }
    get backRefFields() {
        return this._backRefFields;
    }
    setFieldMappedBy(name, oppositeFieldName) {
        this.schema.preChange();
        const field = this.fieldMap.get(name);
        if (field === undefined) {
            throw new Error(`Cannot set the "mappedBy" of field "${name}" because that field is not exists in type "${this.name}"`);
        }
        field.setOppositeFieldName(oppositeFieldName);
    }
    addField(field) {
        this.schema.preChange();
        if (this._fieldMap !== undefined) {
            throw new Error("The current type is frozen becasue the fieldMap is cached");
        }
        if (this._declaredFieldMap.has(field.name)) {
            throw new Error(`The field "${this.name}.${field.name}" is alreay exists`);
        }
        if (field.category === "ID") {
            if (this._superType !== undefined) {
                throw new Error(`Cannot add id field into "${this.name}" because its super class is specified`);
            }
            if (this._idField !== undefined) {
                throw new Error(`Cannot add id field into "${this.name}" because its id field is already specified`);
            }
        }
        if (this.name !== "Query" &&
            this.name !== "Mutation" &&
            field.argGraphQLTypeMap.size !== 0 &&
            field.category !== "LIST" &&
            field.category !== "CONNECTION") {
            throw new Error(`Illegal field ${this.name}.${field.name}, arguments can only be supported by list or connection`);
        }
        const fieldMetadata = new FieldMetadata_1.FieldMetadata(this, field);
        this._declaredFieldMap.set(fieldMetadata.name, fieldMetadata);
        if (field.category === "ID") {
            this._idField = fieldMetadata;
        }
    }
    addBackRefField(backRefField) {
        this.schema.preChange();
        if (backRefField.targetType !== this) {
            throw new Error("Internal bug: Illegal back ref field");
        }
        this._backRefFields.push(backRefField);
    }
    createObject(id) {
        return { [this.idField.name]: id };
    }
}
exports.TypeMetadata = TypeMetadata;
