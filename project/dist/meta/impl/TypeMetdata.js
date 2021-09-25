"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeMetadata = void 0;
const FieldMetadata_1 = require("./FieldMetadata");
class TypeMetadata {
    constructor(schema, category, name) {
        this.schema = schema;
        this.category = category;
        this.name = name;
        this._declaredFieldMap = new Map();
        this._fieldMap = undefined;
    }
    get superType() {
        if (typeof this._superType !== 'string') {
            return this._superType;
        }
        const superMetadata = this.schema.typeMap.get(this._superType);
        if (superMetadata === undefined) {
            throw new Error(`Illegal type "${this.name}" becasue its super type "${this.superType}" is not exists`);
        }
        const cycleTypeNames = [this.name];
        for (let metadata = superMetadata; metadata; metadata = metadata.superType) {
            cycleTypeNames.push(metadata.name);
            if (metadata === this) {
                throw new Error(`Super type reference cycle: ${cycleTypeNames.map(name => `"${name}"`).join(", ")}`);
            }
        }
        this._superType = superMetadata;
        return superMetadata;
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
                        throw new Error(`The filed "${field.fullName}" overrides "${baseField.fullName}", overridden is forbidden`);
                    }
                    fieldMap.set(name, field);
                }
                this._fieldMap = fieldMap;
            }
        }
        return fieldMap;
    }
    setSuperType(superType) {
        if (this._fieldMap !== undefined) {
            throw new Error("The current type is frozen becasue the fieldMap is cached");
        }
        if (this.category !== "OBJECT") {
            throw new Error(`Cannot set the super type for "${this.name}" because its category is not "OBJECT"`);
        }
        if (this._superType !== undefined) {
            throw new Error(`Cannot set the super type for "${this.name}" more than once`);
        }
        this._superType = superType;
    }
    addField(category, name, options) {
        if (this._fieldMap !== undefined) {
            throw new Error("The current type is frozen becasue the fieldMap is cached");
        }
        if (this._declaredFieldMap.has(name)) {
            throw new Error(`The field "${this.name}.${name}" is alreay exists`);
        }
        this._declaredFieldMap.set(name, new FieldMetadata_1.FieldMetadata(this, category, name, options));
    }
    setFieldMappedBy(name, oppositeFieldName) {
        const field = this.fieldMap.get(name);
        if (field === undefined) {
            throw new Error(`Cannot set the "mappedBy" of field "${name}" because that field is not exists in type "${this.name}"`);
        }
        field.setOppositeFieldName(oppositeFieldName);
    }
}
exports.TypeMetadata = TypeMetadata;
