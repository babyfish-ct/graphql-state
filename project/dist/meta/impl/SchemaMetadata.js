"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaMetadata = void 0;
const TypeMetdata_1 = require("./TypeMetdata");
class SchemaMetadata {
    constructor() {
        this.typeMap = new Map();
    }
    addType(category, typeName) {
        this.validateTypeName(typeName);
        this.typeMap.set(typeName, new TypeMetdata_1.TypeMetadata(this, category, typeName));
    }
    validateTypeName(typeName) {
        if (!TYPE_NAME_PATTERN.test(typeName)) {
            throw new Error(`typeName "${typeName}" does not matche the pattern "${TYPE_NAME_PATTERN.source}"`);
        }
        if (this.typeMap.has(typeName)) {
            throw new Error(`Cannot add the type "${typeName}" becasue it's exists`);
        }
    }
}
exports.SchemaMetadata = SchemaMetadata;
const TYPE_NAME_PATTERN = /^[_A-Za-z][_A-Za-z0-0]*$/;
