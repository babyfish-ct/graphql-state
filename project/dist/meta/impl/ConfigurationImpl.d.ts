import { StateManagerImpl } from "../../state/impl/StateManagerImpl";
import { Configuration, TypeRef } from "../Configuration";
import { ConfigurationSchemaTypes, ObjectType } from "../SchemaTypes";
import { TypeConfiguration } from "../TypeConfiguration";
export declare class ConfigurationImpl<TConfigurationSchema extends ConfigurationSchemaTypes> implements Configuration<TConfigurationSchema> {
    addObjectType<TObjectType extends ObjectType, TName extends TObjectType["__typename"]>(objectTypeRef: TypeRef<TObjectType, TName>): Configuration<TConfigurationSchema & {
        objectTypes: {
            readonly [key in TName]: TObjectType;
        };
    }>;
    addConnectionType<TObjectType extends ObjectType, TName extends TObjectType["__typename"]>(objectTypeRef: TypeRef<TObjectType, TName>): Configuration<TConfigurationSchema & {
        collectionTypes: {
            readonly [key in TName]: TObjectType;
        };
    }>;
    addEdgeType<TObjectType extends ObjectType, TName extends TObjectType["__typename"]>(objectTypeRef: TypeRef<TObjectType, TName>): Configuration<TConfigurationSchema & {
        edgeTypes: {
            readonly [key in TName]: TObjectType;
        };
    }>;
    seType<TTypeName extends keyof TConfigurationSchema["objectTypes"] | keyof TConfigurationSchema["collectionTypes"] | keyof TConfigurationSchema["edgeTypes"], TSuperTypeName extends keyof TConfigurationSchema["objectTypes"]>(typeName: TTypeName, typeConfigurer: (tc: TypeConfiguration<TConfigurationSchema, TTypeName>) => void, superTypeName?: string): this;
    addMappedByFields<TTypeName extends keyof TConfigurationSchema["objectTypes"], TFieldName extends keyof TConfigurationSchema["objectTypes"][TTypeName], TTargetTypeName extends keyof TConfigurationSchema["objectTypes"], TTargetFieldName extends keyof TConfigurationSchema["objectTypes"][TTargetTypeName]>(sourceTypeName: TTypeName, sourceFieldName: TFieldName, targetTypeName: TTargetTypeName, targetFieldName: TTargetFieldName): this;
    buildStateManager(): StateManagerImpl<TConfigurationSchema["objectTypes"]>;
}
