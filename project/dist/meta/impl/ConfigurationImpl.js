"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newConfiguration = void 0;
const StateManagerImpl_1 = require("../../state/impl/StateManagerImpl");
const SchemaMetadata_1 = require("./SchemaMetadata");
function newConfiguration(...fetchers) {
    return new ConfigurationImpl(fetchers.map(fetcher => fetcher.fetchableType));
}
exports.newConfiguration = newConfiguration;
class ConfigurationImpl {
    constructor(fetchableTypes) {
        this.schema = new SchemaMetadata_1.SchemaMetadata();
        for (const fetchableType of fetchableTypes) {
            this.schema.addFetchableType(fetchableType);
        }
    }
    bidirectionalAssociation(typeName, mappedByFieldName, oppositeFieldName) {
        const typeMetadata = this.schema.typeMap.get(typeName);
        if (typeMetadata === undefined) {
            throw new Error(`Illegal type name "${typeName}"`);
        }
        const field = typeMetadata.fieldMap.get(mappedByFieldName);
        if (field === undefined) {
            throw new Error(`There is no field "${mappedByFieldName}" in type "${typeName}"`);
        }
        field.setOppositeFieldName(oppositeFieldName);
        return this;
    }
    buildStateManager() {
        for (const [name, type] of this.schema.typeMap) {
            type.idField;
        }
        return new StateManagerImpl_1.StateManagerImpl(this.schema);
    }
}
