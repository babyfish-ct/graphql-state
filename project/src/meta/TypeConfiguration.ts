import { ConfigurationSchemaTypes } from "./SchemaTypes";

export class TypeConfiguration<
    TConfigurationSchema extends ConfigurationSchemaTypes, 
    TName extends 
        keyof TConfigurationSchema["objectTypes"] | 
        keyof TConfigurationSchema["collectionTypes"] | 
        keyof TConfigurationSchema["edgeTypes"]
> {

    constructor(readonly name: TName) {}

    scalar<TFieldName extends keyof TConfigurationSchema["objectTypes"][TName]>(
        name: TFieldName, 
        typeName: "string" | "number" | "boolean", 
        options?: ScalarOptions
    ): this {
        return this;
    }

    reference<TFieldName extends keyof TConfigurationSchema["objectTypes"][TName], TReferencedTypeName extends keyof TConfigurationSchema["objectTypes"]>(
        name: TFieldName, 
        referencedTypeName: TReferencedTypeName, 
        options?: ReferenceOptions<TConfigurationSchema, TReferencedTypeName>
    ): this {
        return this;
    }

    list<TFieldName extends keyof TConfigurationSchema["objectTypes"][TName], TElementTypeName extends keyof TConfigurationSchema["objectTypes"]>(
        name: TFieldName,
        elementTypeName: TElementTypeName,
        options?: CollectionOptions<TConfigurationSchema, TElementTypeName>
    ): this {
        return this;
    }

    connection<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName],
        TCollectionTypeName extends keyof TConfigurationSchema["collectionTypes"],
        TEdgeTypeName extends keyof TConfigurationSchema["edgeTypes"],
        TNodeTypeName extends keyof TConfigurationSchema["objectTypes"]
    >(
        name: TFieldName,
        collectionTypeName: TCollectionTypeName,
        edgeTypeName: TEdgeTypeName,
        nodeTypeName: TNodeTypeName,
        options?: CollectionOptions<TConfigurationSchema, TNodeTypeName>
    ): this {
        return this;
    }
}

export interface ScalarOptions {
    readonly undefinable?: boolean;
    readonly minLength?: number;
    readonly maxLength?: number;
    readonly pattern?: RegExp;
}

export interface ReferenceOptions<TConfigurationSchema extends ConfigurationSchemaTypes, TReferencedTypeName extends keyof TConfigurationSchema["objectTypes"]> {
    readonly undefinable?: boolean,
    readonly deleteOperation?: "CASCADE" | "SET_UNDEFINED",
    readonly mappedBy?: keyof TConfigurationSchema["objectTypes"][TReferencedTypeName]
}

export interface CollectionOptions<TConfigurationSchema extends ConfigurationSchemaTypes, TElementTypeName extends keyof TConfigurationSchema["objectTypes"]> {
    readonly mappedBy?: keyof TConfigurationSchema["objectTypes"][TElementTypeName]
}
