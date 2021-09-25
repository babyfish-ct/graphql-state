"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaMetadata = void 0;
const TypeMetdata_1 = require("./TypeMetdata");
class SchemaMetadata {
    constructor() {
        this._typeMap = new Map();
        this._unresolvedPassiveFields = [];
    }
    get typeMap() {
        return this._typeMap;
    }
    addType(category, typeName) {
        this.validateTypeName(typeName);
        this._typeMap.set(typeName, new TypeMetdata_1.TypeMetadata(this, category, typeName));
    }
    validateTypeName(typeName) {
        if (!TYPE_NAME_PATTERN.test(typeName)) {
            throw new Error(`typeName "${typeName}" does not match the pattern "${TYPE_NAME_PATTERN.source}"`);
        }
        if (this._typeMap.has(typeName)) {
            throw new Error(`Cannot add the type "${typeName}" becasue it's exists`);
        }
    }
    " $registerUnresolvedInversedField"(passiveField) {
        this._unresolvedPassiveFields.push(passiveField);
    }
    " $resolvedInversedFields"() {
        if (this._unresolvedPassiveFields.length === 0) {
            return;
        }
        for (const _unresolvedPassiveField of this._unresolvedPassiveFields) {
            _unresolvedPassiveField[" $resolveInversedAssociation"]();
        }
        this._unresolvedPassiveFields = [];
    }
}
exports.SchemaMetadata = SchemaMetadata;
const TYPE_NAME_PATTERN = /^[_A-Za-z][_A-Za-z0-0]*$/;
