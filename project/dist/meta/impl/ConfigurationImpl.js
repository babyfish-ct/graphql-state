"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationImpl = void 0;
class ConfigurationImpl {
    addObjectType(objectTypeRef) {
        throw new Error("");
    }
    addConnectionType(objectTypeRef) {
        throw new Error("");
    }
    addEdgeType(objectTypeRef) {
        throw new Error("");
    }
    seType(typeName, typeConfigurer, superTypeName) {
        return this;
    }
    addMappedByFields(sourceTypeName, sourceFieldName, targetTypeName, targetFieldName) {
        return this;
    }
    buildStateManager() {
        throw new Error();
    }
}
exports.ConfigurationImpl = ConfigurationImpl;
