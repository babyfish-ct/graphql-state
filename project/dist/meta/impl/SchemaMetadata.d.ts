import { FetchableType, Fetcher } from "graphql-ts-client-api";
import { FieldMetadata } from "./FieldMetadata";
import { TypeMetadata } from "./TypeMetdata";
export declare class SchemaMetadata {
    private _acceptableFetchableTypes;
    private _rootFetcherMap;
    private _typeMap;
    private _unresolvedPassiveFields;
    private _frozen;
    get typeMap(): ReadonlyMap<string, TypeMetadata>;
    addFetcher(fetcher: Fetcher<string, object, object>): void;
    isAcceptable(fetchableType: FetchableType<string>): boolean;
    fetcher(typeName: string): Fetcher<string, object, object> | undefined;
    freeze(): this;
    preChange(): void;
    " $registerUnresolvedInversedField"(passiveField: FieldMetadata): void;
    " $resolvedInversedFields"(): void;
}
