import { ConfigurationSchemaTypes } from "./SchemaTypes";

export interface TypeConfiguration<
    TConfigurationSchema extends ConfigurationSchemaTypes, 
    TName extends 
        keyof TConfigurationSchema["objectTypes"] | 
        keyof TConfigurationSchema["collectionTypes"] | 
        keyof TConfigurationSchema["edgeTypes"]
> {

    superType<XSuperName extends keyof TConfigurationSchema["objectTypes"] & string>(
        superName: XSuperName
    ): this;

    id<TFieldName extends keyof TConfigurationSchema["objectTypes"][TName] & string>(
        name: TFieldName
    ): this;

    reference<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName] & string, 
        TReferencedTypeName extends keyof TConfigurationSchema["objectTypes"] & string
    >(
        name: TFieldName, 
        referencedTypeName: TReferencedTypeName, 
        options?: ReferenceOptions<TConfigurationSchema, TReferencedTypeName>
    ): this;

    list<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName] & string, 
        TElementTypeName extends keyof TConfigurationSchema["objectTypes"] & string
    >(
        name: TFieldName,
        elementTypeName: TElementTypeName,
        options?: CollectionTypeName<TConfigurationSchema, TElementTypeName>
    ): this;

    connection<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName] & string,
        TCollectionTypeName extends keyof TConfigurationSchema["collectionTypes"] & string,
        TEdgeTypeName extends keyof TConfigurationSchema["edgeTypes"] & string,
        TNodeTypeName extends keyof TConfigurationSchema["objectTypes"] & string
    >(
        name: TFieldName,
        collectionTypeName: TCollectionTypeName,
        edgeTypeName: TEdgeTypeName,
        nodeTypeName: TNodeTypeName,
        options?: CollectionTypeName<TConfigurationSchema, TNodeTypeName>
    ): this;

    mappedBy<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName] & string,
    >(
        fieldName: TFieldName,
        oppositeFieldName: string
    ): this;
}

export interface ReferenceOptions<TConfigurationSchema extends ConfigurationSchemaTypes, TReferencedTypeName extends keyof TConfigurationSchema["objectTypes"]> {
    readonly undefinable?: boolean,
    readonly deleteOperation?: "CASCADE" | "SET_UNDEFINED",
    readonly mappedBy?: keyof TConfigurationSchema["objectTypes"][TReferencedTypeName] & string
}

export interface CollectionTypeName<TConfigurationSchema extends ConfigurationSchemaTypes, TElementTypeName extends keyof TConfigurationSchema["objectTypes"]> {
    readonly mappedBy?: keyof TConfigurationSchema["objectTypes"][TElementTypeName] & string
}
