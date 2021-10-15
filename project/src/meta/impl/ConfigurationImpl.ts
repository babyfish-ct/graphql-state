import { FetchableType, Fetcher } from "graphql-ts-client-api";
import { StateManagerImpl } from "../../state/impl/StateManagerImpl";
import { StateManager } from "../../state/StateManager";
import { Configuration, Network } from "../Configuration";
import { SchemaType } from "../SchemaType";
import { SchemaMetadata } from "./SchemaMetadata";

export function newConfiguration<TSchema extends SchemaType>(
    ...fetchers: Fetcher<any, {}, {}>[]
): Configuration<TSchema> {
    return new ConfigurationImpl<TSchema>(fetchers.map(fetcher => fetcher.fetchableType));
}

class ConfigurationImpl<TSchema extends SchemaType> implements Configuration<TSchema> {

    private _schema = new SchemaMetadata();

    private _network?: Network;

    constructor(fetchableTypes: ReadonlyArray<FetchableType<string>>) {
        for (const fetchableType of fetchableTypes) {
            this._schema.addFetchableType(fetchableType);
        }
    }

    bidirectionalAssociation<
        TTypeName extends keyof TSchema & string, 
        TMappedByFieldName extends keyof TSchema[TTypeName][" $associations"] & string, 
        TOppositeFieldName extends keyof TSchema[TSchema[TTypeName][" $associations"][TMappedByFieldName]][" $associations"] & string
    >(
        typeName: TTypeName,
        mappedByFieldName: TMappedByFieldName,
        oppositeFieldName: TOppositeFieldName
    ): this {
        const typeMetadata = this._schema.typeMap.get(typeName);
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

    network(network: Network): this {
        this._network = network;
        return this;
    }

    buildStateManager(): StateManager<TSchema> {
        for (const [name, type] of this._schema.typeMap) {
            type.idField;
        }
        return new StateManagerImpl<TSchema>(this._schema, this._network);
    }
}
