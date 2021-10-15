import { FetchableType } from "graphql-ts-client-api";
import { FieldMetadata } from "./FieldMetadata";
import { TypeMetadata } from "./TypeMetdata";
export declare class SchemaMetadata {
    private _acceptableFetchableTypes;
    private _typeMap;
    private _unresolvedPassiveFields;
    private _frozen;
    get typeMap(): ReadonlyMap<string, TypeMetadata>;
    addFetchableType(fetchableType: FetchableType<string>): void;
    isAcceptable(fetchableType: FetchableType<string>): boolean;
    freeze(): this;
    preChange(): void;
    " $registerUnresolvedInversedField"(passiveField: FieldMetadata): void;
    " $resolvedInversedFields"(): void;
}
