import { StateManagerImpl } from "../../state/impl/StateManagerImpl";
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
        TName extends string
    >(
        typeRef: TypeRef<TObjectType, TName>,
    ): Configuration<
        TConfigurationSchema & 
        { 
            objectTypes: { 
                readonly [key in TName]: TObjectType & 
                {readonly __typename: TName}
            }
        }
    > {
        this.schema.addType("OBJECT", typeRef.name);
        return this as any;
    }

    addConnectionType<TObjectType extends ObjectType, TName extends string>(
        typeRef: TypeRef<TObjectType, TName>
    ): Configuration<
        TConfigurationSchema & 
        { collectionTypes: { readonly [key in TName]: TObjectType}}
    > {
        this.schema.addType("CONNECTION", typeRef.name);
        return this as any;
    }

    addEdgeType<TObjectType extends ObjectType, TName extends string>(
        typeRef: TypeRef<TObjectType, TName>
    ): Configuration<
        TConfigurationSchema & 
        { edgeTypes: { readonly [key in TName]: TObjectType}}
    > {
        this.schema.addType("EDGE", typeRef.name);
        return this as any;
    }

    setObjectType<
        TTypeName extends keyof TConfigurationSchema["objectTypes"]
    >(
        typeName: TTypeName,
        typeConfigurer: (tc: TypeConfiguration<TConfigurationSchema, TTypeName>) => void
    ): this {
        const type = this.schema.typeMap.get(typeName as string);
        if (type === undefined) {
            throw new Error(`The type "${typeName}" is not exists in this configuration`);
        }
        if (type === undefined) {
            throw new Error(`The category of  the type "${typeName}" in this configuration is not "ObJECT"`);
        }
        typeConfigurer(new TypeConfigurationImpl<TConfigurationSchema, TTypeName>(type));
        return this;
    }

    buildStateManager(): StateManager<TConfigurationSchema["objectTypes"]> {
        for (const [name, type] of this.schema.typeMap) {
            type.idField;
        }
        return new StateManagerImpl<TConfigurationSchema["objectTypes"]>(this.schema);
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

    superType<XSuperName extends keyof TConfigurationSchema["objectTypes"]>(
        superName: XSuperName
    ): this {
        this.type.setSuperType(superName as string);
        return this;
    }

    id<TFieldName extends keyof TConfigurationSchema["objectTypes"][TName]>(
        name: TFieldName
    ): this {
        this.type.addField("ID", name as string);
        return this;
    }

    reference<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName], 
        TReferencedTypeName extends keyof TConfigurationSchema["objectTypes"]
    >(
        name: TFieldName, 
        referencedTypeName: TReferencedTypeName, 
        options?: ReferenceOptions<TConfigurationSchema, TReferencedTypeName>
    ): this {
        this.type.addField("REFERENCE", name as string, {
            targetTypeName: referencedTypeName as string,
            undefinable: options?.undefinable,
            deleteOperation: options?.deleteOperation,
            mappedBy: options?.mappedBy as string | undefined
        });
        return this;
    }

    list<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName], 
        TElementTypeName extends keyof TConfigurationSchema["objectTypes"]
    >(
        name: TFieldName,
        elementTypeName: TElementTypeName,
        options?: CollectionTypeName<TConfigurationSchema, TElementTypeName>
    ): this {
        this.type.addField("LIST", name as string, { 
            targetTypeName: elementTypeName as string,
            mappedBy: options?.mappedBy as string | undefined 
        });
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
        options?: CollectionTypeName<TConfigurationSchema, TNodeTypeName>
    ): this {
        this.type.addField("CONNECTION", name as string, { 
            connectionTypeName: collectionTypeName as string,
            edgeTypeName: edgeTypeName as string,
            targetTypeName: nodeTypeName as string,
            mappedBy: options?.mappedBy as string | undefined 
        });
        return this;
    }

    mappedBy<
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TName],
    >(
        fieldName: TFieldName,
        oppositeFieldName: string
    ): this {
        this.type.setFieldMappedBy(fieldName as string, oppositeFieldName);
        return this;
    }
}