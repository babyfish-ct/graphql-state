import { StateManager } from "../state/StateManager";
import { ObjectType, ConfigurationSchemaTypes } from "./SchemaTypes";
import { TypeConfiguration } from "./TypeConfiguration";
export interface Configuration<TConfigurationSchema extends ConfigurationSchemaTypes> {
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
    buildStateManager(): StateManager<TConfigurationSchema["objectTypes"]>;
}
export declare function typeRefBuilder<TObjectType extends ObjectType>(): TypeRefBuilder<TObjectType>;
export interface TypeRefBuilder<TObjectType extends ObjectType> {
    named<TName extends TObjectType["__typename"]>(name?: TName): TypeRef<TObjectType, TName>;
    " $supressWarnings"(_1: TObjectType): void;
}
export interface TypeRef<TObjectType extends ObjectType, TName extends TObjectType["__typename"]> {
    readonly name: string;
    " $supressWarnings"(_1: TObjectType, _2: TName): void;
}
