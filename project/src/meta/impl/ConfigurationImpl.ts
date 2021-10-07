import { FetchableType, Fetcher } from "graphql-ts-client-api";
import { StateManagerImpl } from "../../state/impl/StateManagerImpl";
import { StateManager } from "../../state/StateManager";
import { Configuration } from "../Configuration";
import { SchemaType } from "../SchemaType";
import { SchemaMetadata } from "./SchemaMetadata";

export function newConfiguration<TSchema extends SchemaType>(
    ...fetchers: Fetcher<any, {}, {}>[]
): Configuration<TSchema> {
    return new ConfigurationImpl<TSchema>(fetchers.map(fetcher => fetcher.fetchableType));
}

class ConfigurationImpl<TSchema extends SchemaType> implements Configuration<TSchema> {

    private schema = new SchemaMetadata();

    constructor(fetchableTypes: ReadonlyArray<FetchableType<string>>) {
        for (const fetchableType of fetchableTypes) {
            this.schema.addFetchableType(fetchableType);
        }
    }

    bidirectionalAssociation<
        TTypeName extends keyof TSchema & string, 
        TFieldName extends keyof TSchema[TTypeName][" $associations"] & string, 
        TMappedByFieldName extends keyof TSchema[TSchema[TTypeName][" $associations"][TFieldName]][" $associations"] & string
    >(
        typeName: TTypeName,
        fieldName: TFieldName,
        mappedByFieldName: TMappedByFieldName
    ): this {
        const typeMetadata = this.schema.typeMap.get(typeName);
        if (typeMetadata === undefined) {
            throw new Error(`Illegal type name "${typeName}"`);
        }
        const field = typeMetadata.fieldMap.get(fieldName);
        if (field === undefined) {
            throw new Error(`There is no field "${fieldName}" in type "${typeName}"`);
        }
        field.setOppositeFieldName(mappedByFieldName);
        return this;
    }

    buildStateManager(): StateManager<TSchema> {
        for (const [name, type] of this.schema.typeMap) {
            type.idField;
        }
        return new StateManagerImpl<TSchema>(this.schema);
    }
}
