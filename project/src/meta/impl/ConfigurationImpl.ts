import { StateManager } from "../../state/StateManager";
import { Configuration, TypeRef } from "../Configuration";
import { ConfigurationSchemaTypes, ObjectType } from "../SchemaTypes";
import { CollectionTypeName, ReferenceOptions, TypeConfiguration } from "../TypeConfiguration";
import { SchemaMetadata } from "./SchemaMetadata";
import { TypeMetadata } from "./TypeMetdata";

export function newConfiguration(
): Configuration<{ objectTypes: {}, collectionTypes: {}, edgeTypes: {}}> {
    return new ConfigurationImpl();
}

class ConfigurationImpl<TConfigurationSchema extends ConfigurationSchemaTypes> implements Configuration<TConfigurationSchema> {

    private schema = new SchemaMetadata();

    addObjectType<
        TObjectType extends ObjectType, 
        TName extends TObjectType["__typename"]
    >(
        objectTypeRef: TypeRef<TObjectType, TName>,
    ): Configuration<
        TConfigurationSchema & 
        { 
            objectTypes: { 
                readonly [key in TName]: TObjectType & 
                {readonly __typename: TName}
            }
        }
    > {
        this.schema.addType("OBJECT", objectTypeRef.name);
        return this as any;
    }

    addConnectionType<TObjectType extends ObjectType, TName extends string>(
        objectTypeRef: TypeRef<TObjectType, TName>
    ): Configuration<
        TConfigurationSchema & 
        { collectionTypes: { readonly [key in TName]: TObjectType}}
    > {
        this.schema.addType("CONNECTION", objectTypeRef.name);
        return this as any;
    }

    addEdgeType<TObjectType extends ObjectType, TName extends string>(
        objectTypeRef: TypeRef<TObjectType, TName>
    ): Configuration<
        TConfigurationSchema & 
        { edgeTypes: { readonly [key in TName]: TObjectType}}
    > {
        this.schema.addType("EDGE", objectTypeRef.name);
        return this as any;
    }

    setObjectType<
        TTypeName extends keyof TConfigurationSchema["objectTypes"] & string
    >(
        typeName: TTypeName,
        typeConfigurer: (tc: TypeConfiguration<TConfigurationSchema, TTypeName>) => void
    ): this {
        const type = this.schema.typeMap.get(typeName);
        if (type === undefined) {
            throw new Error(`The type "${typeName}" is not exists in this configuration`);
        }
        if (type === undefined) {
            throw new Error(`The category of  the type "${typeName}" in this configuration is not "ObJECT"`);
        }
        typeConfigurer(new TypeConfigurationImpl(type));
        return this;
    }

    buildStateManager(): StateManager<TConfigurationSchema["objectTypes"]> {
        throw new Error();
    }
}

class TypeConfigurationImpl<
    TConfigurationSchema extends ConfigurationSchemaTypes, 
    TName extends 
        keyof TConfigurationSchema["objectTypes"] | 
        keyof TConfigurationSchema["collectionTypes"] | 
    keyof TConfigurationSchema["edgeTypes"]
> implements TypeConfiguration<TConfigurationSchema, TName> {

    constructor(private type: TypeMetadata) {}

    superType<XSuperName extends keyof TConfigurationSchema["objectTypes"] & string>(
        superName: XSuperName
    ): this {
        this.type.setSuperType(superName);
        return this;
    }

    id<TFieldName extends keyof TConfigurationSchema["objectTypes"][TName] & string>(
        name: TFieldName
    ): this {
        this.type.addField("ID", name);
        return this;
    }

    reference<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName] & string, 
        TReferencedTypeName extends keyof TConfigurationSchema["objectTypes"] & string
    >(
        name: TFieldName, 
        referencedTypeName: TReferencedTypeName, 
        options?: ReferenceOptions<TConfigurationSchema, TReferencedTypeName>
    ): this {
        this.type.addField("REFERENCE", name, {
            undefinable: options?.undefinable,
            deleteOperation: options?.deleteOperation,
            mappedBy: options?.mappedBy
        });
        return this;
    }

    list<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName] & string, 
        TElementTypeName extends keyof TConfigurationSchema["objectTypes"] & string
    >(
        name: TFieldName,
        elementTypeName: TElementTypeName,
        options?: CollectionTypeName<TConfigurationSchema, TElementTypeName>
    ): this {
        this.type.addField("LIST", name, { mappedBy: options?.mappedBy });
        return this;
    }

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
    ): this {
        this.type.addField("CONNECTION", name, { mappedBy: options?.mappedBy });
        return this;
    }

    mappedBy<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName] & string,
    >(
        fieldName: TFieldName,
        oppositeFieldName: string
    ): this {
        this.type.setFieldMappedBy(fieldName, oppositeFieldName);
        return this;
    }
}