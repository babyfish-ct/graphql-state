"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newConfiguration = void 0;
const StateManagerImpl_1 = require("../../state/impl/StateManagerImpl");
const SchemaMetadata_1 = require("./SchemaMetadata");
function newConfiguration(...fetchers) {
    return new ConfigurationImpl(fetchers);
}
exports.newConfiguration = newConfiguration;
class ConfigurationImpl {
    constructor(fetchers) {
        this._schema = new SchemaMetadata_1.SchemaMetadata();
        for (const fetcher of fetchers) {
            this._schema.addFetcher(fetcher);
        }
    }
    rootAssociationProperties(fieldName, properties) {
        this.field("Query", fieldName).setAssocaitionProperties(properties);
        return this;
    }
    associationProperties(typeName, fieldName, properties) {
        this.field(typeName, fieldName).setAssocaitionProperties(properties);
        return this;
    }
    bidirectionalAssociation(typeName, fieldName, oppositeFieldName) {
        this.field(typeName, fieldName).setOppositeFieldName(oppositeFieldName);
        return this;
    }
    network(network) {
        this._network = network;
        return this;
    }
    buildStateManager() {
        for (const [name, type] of this._schema.typeMap) {
            if (type.category === "OBJECT") {
                type.idField;
            }
        }
        return new StateManagerImpl_1.StateManagerImpl(this._schema, this._network);
    }
    field(typeName, fieldName) {
        const typeMetadata = this._schema.typeMap.get(typeName);
        if (typeMetadata === undefined) {
            throw new Error(`Illegal type name "${typeName}"`);
        }
        const field = typeMetadata.fieldMap.get(fieldName);
        if (field === undefined) {
            throw new Error(`There is no field "${fieldName}" in type "${typeName}"`);
        }
        return field;
    }
}
