"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newConfiguration = void 0;
const SchemaMetadata_1 = require("./SchemaMetadata");
function newConfiguration() {
    return new ConfigurationImpl();
}
exports.newConfiguration = newConfiguration;
class ConfigurationImpl {
    constructor() {
        this.schema = new SchemaMetadata_1.SchemaMetadata();
    }
    addObjectType(objectTypeRef) {
        this.schema.addType("OBJECT", objectTypeRef.name);
        return this;
    }
    addConnectionType(objectTypeRef) {
        this.schema.addType("CONNECTION", objectTypeRef.name);
        return this;
    }
    addEdgeType(objectTypeRef) {
        this.schema.addType("EDGE", objectTypeRef.name);
        return this;
    }
    setObjectType(typeName, typeConfigurer) {
        const type = this.schema.typeMap.get(typeName);
        if (type === undefined) {
            throw new Error(`The type "${typeName}" is not exists in this configuration`);
        }
        if (type === undefined) {
            throw new Error(`The category of  the type "${typeName}" in this configuration is not "ObJECT"`);
        }
        typeConfigurer(new TypeConfigurationImpl(type));
        return this;
    }
    buildStateManager() {
        throw new Error();
    }
}
class TypeConfigurationImpl {
    constructor(type) {
        this.type = type;
    }
    superType(superName) {
        this.type.setSuperType(superName);
        return this;
    }
    id(name) {
        this.type.addField("ID", name);
        return this;
    }
    reference(name, referencedTypeName, options) {
        this.type.addField("REFERENCE", name, {
            undefinable: options === null || options === void 0 ? void 0 : options.undefinable,
            deleteOperation: options === null || options === void 0 ? void 0 : options.deleteOperation,
            mappedBy: options === null || options === void 0 ? void 0 : options.mappedBy
        });
        return this;
    }
    list(name, elementTypeName, options) {
        this.type.addField("LIST", name, { mappedBy: options === null || options === void 0 ? void 0 : options.mappedBy });
        return this;
    }
    connection(name, collectionTypeName, edgeTypeName, nodeTypeName, options) {
        this.type.addField("CONNECTION", name, { mappedBy: options === null || options === void 0 ? void 0 : options.mappedBy });
        return this;
    }
    mappedBy(fieldName, oppositeFieldName) {
        this.type.setFieldMappedBy(fieldName, oppositeFieldName);
        return this;
    }
}
