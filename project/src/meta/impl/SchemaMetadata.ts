import { FetchableType } from "graphql-ts-client-api";
import { FieldMetadata } from "./FieldMetadata";
import { TypeMetadata } from "./TypeMetdata";

export class SchemaMetadata {

    private _acceptableFetchableTypes = new Set<FetchableType<string>>();

    private _typeMap = new Map<string, TypeMetadata>();

    private _unresolvedPassiveFields: FieldMetadata[] = [];

    private _frozen = false;

    get typeMap(): ReadonlyMap<string, TypeMetadata> {
        return this._typeMap;
    }

    addFetchableType(fetchableType: FetchableType<string>) {
        if (this._typeMap.has(fetchableType.name)) {
            throw new Error(`The type "${fetchableType.name}" is already exists`);
        }
        this._acceptableFetchableTypes.add(fetchableType);
        this._typeMap.set(fetchableType.name, new TypeMetadata(this, fetchableType));
    }

    isAcceptable(fetchableType: FetchableType<string>): boolean {
        return this._acceptableFetchableTypes.has(fetchableType);
    }

    freeze(): this {
        this._frozen = true;
        return this;
    }

    preChange() {
        if (this._frozen) {
            throw new Error("Cannot change the schema becasue it's frozen");
        }
    }

    " $registerUnresolvedInversedField"(passiveField: FieldMetadata) {
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
