import { ConfigurationSchemaTypes } from "./SchemaTypes";

export interface TypeConfiguration<
    TConfigurationSchema extends ConfigurationSchemaTypes, 
    TName extends 
        keyof TConfigurationSchema["objectTypes"] | 
        keyof TConfigurationSchema["collectionTypes"] | 
        keyof TConfigurationSchema["edgeTypes"]
> {

    superType<XSuperName extends keyof TConfigurationSchema["objectTypes"]>(
        superName: XSuperName
    ): this;

    id<TFieldName extends keyof TConfigurationSchema["objectTypes"][TName]>(
        name: TFieldName
    ): this;

    reference<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName], 
        TReferencedTypeName extends keyof TConfigurationSchema["objectTypes"]
    >(
        name: TFieldName, 
        referencedTypeName: TReferencedTypeName, 
        options?: ReferenceOptions<TConfigurationSchema, TReferencedTypeName>
    ): this;

    list<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName], 
        TElementTypeName extends keyof TConfigurationSchema["objectTypes"]
    >(
        name: TFieldName,
        elementTypeName: TElementTypeName,
        options?: CollectionTypeName<TConfigurationSchema, TElementTypeName>
    ): this;

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
        options?: CollectionTypeName<TConfigurationSchema, TNodeTypeName>
    ): this;

    mappedBy<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName],
    >(
        fieldName: TFieldName,
        oppositeFieldName: string
    ): this;
}

export interface ReferenceOptions<TConfigurationSchema extends ConfigurationSchemaTypes, TReferencedTypeName extends keyof TConfigurationSchema["objectTypes"]> {
    readonly undefinable?: boolean,
    readonly deleteOperation?: "CASCADE" | "SET_UNDEFINED",
    readonly mappedBy?: keyof TConfigurationSchema["objectTypes"][TReferencedTypeName]
}

export interface CollectionTypeName<TConfigurationSchema extends ConfigurationSchemaTypes, TElementTypeName extends keyof TConfigurationSchema["objectTypes"]> {
    readonly mappedBy?: keyof TConfigurationSchema["objectTypes"][TElementTypeName]
}