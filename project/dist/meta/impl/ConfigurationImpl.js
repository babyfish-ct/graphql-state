"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newConfiguration = void 0;
const StateManagerImpl_1 = require("../../state/impl/StateManagerImpl");
const SchemaMetadata_1 = require("./SchemaMetadata");
function newConfiguration() {
    return new ConfigurationImpl();
}
exports.newConfiguration = newConfiguration;
class ConfigurationImpl {
    constructor() {
        this.schema = new SchemaMetadata_1.SchemaMetadata();
    }
    addObjectType(typeRef) {
        this.schema.addType("OBJECT", typeRef.name);
        return this;
    }
    addConnectionType(typeRef) {
        this.schema.addType("CONNECTION", typeRef.name);
        return this;
    }
    addEdgeType(typeRef) {
        this.schema.addType("EDGE", typeRef.name);
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
        for (const [name, type] of this.schema.typeMap) {
            type.idField;
        }
        return new StateManagerImpl_1.StateManagerImpl(this.schema);
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
            targetTypeName: referencedTypeName,
            undefinable: options === null || options === void 0 ? void 0 : options.undefinable,
            deleteOperation: options === null || options === void 0 ? void 0 : options.deleteOperation,
            mappedBy: options === null || options === void 0 ? void 0 : options.mappedBy
        });
        return this;
    }
    list(name, elementTypeName, options) {
        this.type.addField("LIST", name, {
            targetTypeName: elementTypeName,
            mappedBy: options === null || options === void 0 ? void 0 : options.mappedBy
        });
        return this;
    }
    connection(name, collectionTypeName, edgeTypeName, nodeTypeName, options) {
        this.type.addField("CONNECTION", name, {
            connectionTypeName: collectionTypeName,
            edgeTypeName: edgeTypeName,
            targetTypeName: nodeTypeName,
            mappedBy: options === null || options === void 0 ? void 0 : options.mappedBy
        });
        return this;
    }
    mappedBy(fieldName, oppositeFieldName) {
        this.type.setFieldMappedBy(fieldName, oppositeFieldName);
        return this;
    }
}
