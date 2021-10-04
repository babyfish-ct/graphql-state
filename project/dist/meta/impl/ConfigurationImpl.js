"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newConfiguration = void 0;
const StateManagerImpl_1 = require("../../state/impl/StateManagerImpl");
const SchemaMetadata_1 = require("./SchemaMetadata");
function newConfiguration(...fethers) {
    return new ConfigurationImpl([]);
}
exports.newConfiguration = newConfiguration;
class ConfigurationImpl {
    constructor(fetchableTypes) {
        this.schema = new SchemaMetadata_1.SchemaMetadata();
    }
    buildStateManager() {
        for (const [name, type] of this.schema.typeMap) {
            type.idField;
        }
        return new StateManagerImpl_1.StateManagerImpl(this.schema);
    }
}
