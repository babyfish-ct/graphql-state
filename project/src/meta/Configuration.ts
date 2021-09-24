import { StateManager } from "../state/StateManager";
import { ObjectType, ConfigurationSchemaTypes } from "./SchemaTypes";
import { TypeConfiguration } from "./TypeConfiguration";

export interface Configuration<TConfigurationSchema extends ConfigurationSchemaTypes> {

    declareObjectType<
        TObjectType extends ObjectType, 
        TName extends TObjectType["__typename"],
        TSuperTypeName extends keyof TConfigurationSchema["objectTypes"] = never
    >(
        objectTypeRef: TypeRef<TObjectType, TName>,
        superName?: TSuperTypeName
    ): Configuration<TConfigurationSchema & { objectTypes: { readonly [key in TName]: TObjectType}}>;

    declareConnectionType<TObjectType extends ObjectType, TName extends TObjectType["__typename"]>(
        objectTypeRef: TypeRef<TObjectType, TName>
    ): Configuration<TConfigurationSchema & { collectionTypes: { readonly [key in TName]: TObjectType}}>;

    declareEdgeType<TObjectType extends ObjectType, TName extends TObjectType["__typename"]>(
        objectTypeRef: TypeRef<TObjectType, TName>
    ): Configuration<TConfigurationSchema & { edgeTypes: { readonly [key in TName]: TObjectType}}>;

    implementType<
        TTypeName extends 
            keyof TConfigurationSchema["objectTypes"] | 
            keyof TConfigurationSchema["collectionTypes"] | 
            keyof TConfigurationSchema["edgeTypes"]
    >(
        typeName: TTypeName,
        typeConfigurer: (tc: TypeConfiguration<TConfigurationSchema, TTypeName>) => void
    ): this;

    mappedBy<
        TTypeName extends keyof TConfigurationSchema["objectTypes"], 
        TFieldName extends keyof TConfigurationSchema["objectTypes"][TTypeName], 
        TTargetTypeName extends keyof TConfigurationSchema["objectTypes"], 
        TTargetFieldName extends keyof TConfigurationSchema["objectTypes"][TTargetTypeName]
    >(
        sourceTypeName: TTypeName,
        sourceFieldName: TFieldName,
        targetTypeName: TTargetTypeName,
        targetFieldName: TTargetFieldName
    ): this;

    buildStateManager(): StateManager;
}

export function typeRefBuilder<
    TObjectType extends ObjectType,
>(): TypeRefBuilder<TObjectType> {
    return { named: (name: string) => ({name} as TypeRef<TObjectType, any>) } as TypeRefBuilder<TObjectType>; 
}

export interface TypeRefBuilder<TObjectType extends ObjectType> {
    
    named<TName extends TObjectType["__typename"]>(name?: TName): TypeRef<TObjectType, TName>;

    " $supressWarnings"(_1: TObjectType): void;
}

export interface TypeRef<TObjectType extends ObjectType, TName extends TObjectType["__typename"]> {
    
    readonly name: string;

    " $supressWarnings"(_1: TObjectType, _2: TName): void;
}
