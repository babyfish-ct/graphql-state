import { FetchableType, Fetcher } from "graphql-ts-client-api";
import { FieldMetadata } from "./FieldMetadata";
import { TypeMetadata } from "./TypeMetdata";

export class SchemaMetadata {

    private _acceptableFetchableTypes = new Set<FetchableType<string>>();

    private _rootFetcherMap = new Map<string, Fetcher<string, object, object>>();

    private _typeMap = new Map<string, TypeMetadata>();

    private _unresolvedPassiveFields: FieldMetadata[] = [];

    private _frozen = false;

    get typeMap(): ReadonlyMap<string, TypeMetadata> {
        return this._typeMap;
    }

    addFetcher(fetcher: Fetcher<string, object, object>) {
        const fetchableType = fetcher.fetchableType;
        if (this._typeMap.has(fetchableType.name)) {
            throw new Error(`The type "${fetchableType.name}" is already exists`);
        }
        if (fetcher.fieldMap.size !== 0) {
            throw new Error(`The fetcher is not empty`);
        }
        this._acceptableFetchableTypes.add(fetchableType);
        this._rootFetcherMap.set(fetcher.fetchableType.name, fetcher);
        this._typeMap.set(fetchableType.name, new TypeMetadata(this, fetchableType));
    }

    isAcceptable(fetchableType: FetchableType<string>): boolean {
        return this._acceptableFetchableTypes.has(fetchableType);
    }

    fetcher(typeName: string): Fetcher<string, object, object> | undefined {
        return this._rootFetcherMap.get(typeName);
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
