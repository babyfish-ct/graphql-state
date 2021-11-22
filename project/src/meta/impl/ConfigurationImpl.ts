import { Fetcher } from "graphql-ts-client-api";
import { StateManagerImpl } from "../../state/impl/StateManagerImpl";
import { StateManager } from "../../state/StateManager";
import { Configuration } from "../Configuration";
import { Network, NetworkBuilder } from "../Network";
import { SchemaType } from "../SchemaType";
import { FieldMetadata } from "./FieldMetadata";
import { SchemaMetadata } from "./SchemaMetadata";

export function newConfiguration<TSchema extends SchemaType>(
    ...fetchers: Fetcher<string, object, object>[]
): Configuration<TSchema> {
    return new ConfigurationImpl<TSchema>(fetchers);
}

class ConfigurationImpl<TSchema extends SchemaType> implements Configuration<TSchema> {

    private _schema = new SchemaMetadata();

    private _network?: Network;

    private _networkBuilder?: NetworkBuilder;

    constructor(fetchers: ReadonlyArray<Fetcher<string, object, object>>) {
        for (const fetcher of fetchers) {
            this._schema.addFetcher(fetcher);
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

    networkBuilder(networkBuilder: NetworkBuilder): this {
        this._networkBuilder = networkBuilder;
        return this;
    }

    buildStateManager(): StateManager<TSchema> {
        for (const type of this._schema.typeMap.values()) {
            if (type.category === "OBJECT") {
                type.idField;
            }
            for (const field of type.declaredFieldMap.values()) {
                field.targetType;
            }
        }
        if (this._network && this._networkBuilder) {
            throw new Error('Both network and networkBuilder are configured');
        }
        const schema = this._schema.freeze();
        if (this._networkBuilder !== undefined) {
            this._network = this._networkBuilder.build(schema);
        }
        return new StateManagerImpl<TSchema>(schema, this._network);
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
