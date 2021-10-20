import { FetchableType, Fetcher } from "graphql-ts-client-api";
import { StateManagerImpl } from "../../state/impl/StateManagerImpl";
import { StateManager } from "../../state/StateManager";
import { Configuration, Network } from "../Configuration";
import { SchemaType } from "../SchemaType";
import { FieldMetadata } from "./FieldMetadata";
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

    rootAssociationProperties(
        fieldName: string,
        properties: any
    ): this {
        this.field("Query", fieldName).setAssocaitionProperties(properties);
        return this;
    }

    associationProperties(
        typeName: string,
        fieldName: string,
        properties: any
    ): this {
        this.field(typeName, fieldName).setAssocaitionProperties(properties);
        return this;
    }

    bidirectionalAssociation<
        TTypeName extends keyof TSchema["entities"] & string, 
        TFieldName extends keyof TSchema["entities"][TTypeName][" $associationTypes"] & string, 
        TOppositeFieldName extends keyof TSchema["entities"][
            TSchema["entities"][TTypeName][" $associationTypes"][TFieldName]
        ][" $associationTypes"] & string
    >(
        typeName: TTypeName,
        fieldName: TFieldName,
        oppositeFieldName: TOppositeFieldName
    ): this {
        this.field(typeName, fieldName).setOppositeFieldName(oppositeFieldName);
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

    private field(typeName: string, fieldName: string): FieldMetadata {
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
