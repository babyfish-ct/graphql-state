"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaMetadata = void 0;
const TypeMetdata_1 = require("./TypeMetdata");
class SchemaMetadata {
    constructor() {
        this._acceptableFetchableTypes = new Set();
        this._rootFetcherMap = new Map();
        this._typeMap = new Map();
        this._unresolvedPassiveFields = [];
        this._frozen = false;
    }
    get typeMap() {
        return this._typeMap;
    }
    addFetcher(fetcher) {
        const fetchableType = fetcher.fetchableType;
        if (this._typeMap.has(fetchableType.name)) {
            throw new Error(`The type "${fetchableType.name}" is already exists`);
        }
        if (fetcher.fieldMap.size !== 0) {
            throw new Error(`The fetcher is not empty`);
        }
        this._acceptableFetchableTypes.add(fetchableType);
        this._rootFetcherMap.set(fetcher.fetchableType.name, fetcher);
        this._typeMap.set(fetchableType.name, new TypeMetdata_1.TypeMetadata(this, fetchableType));
    }
    isAcceptable(fetchableType) {
        return this._acceptableFetchableTypes.has(fetchableType);
    }
    fetcher(typeName) {
        return this._rootFetcherMap.get(typeName);
    }
    freeze() {
        this._frozen = true;
        return this;
    }
    preChange() {
        if (this._frozen) {
            throw new Error("Cannot change the schema becasue it's frozen");
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
