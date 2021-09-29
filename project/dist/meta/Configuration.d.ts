import { StateManager } from "../state/StateManager";
import { ObjectType, ConfigurationSchemaTypes } from "./SchemaTypes";
import { TypeConfiguration } from "./TypeConfiguration";
export interface Configuration<TConfigurationSchema extends ConfigurationSchemaTypes> {
    addObjectType<TObjectType extends ObjectType, TName extends string>(typeRef: TypeRef<TObjectType, TName>): Configuration<TConfigurationSchema & {
        objectTypes: {
            readonly [key in TName]: TObjectType;
        };
    }>;
    addConnectionType<TObjectType extends ObjectType, TName extends string>(typeRef: TypeRef<TObjectType, TName>): Configuration<TConfigurationSchema & {
        collectionTypes: {
            readonly [key in TName]: TObjectType;
        };
    }>;
    addEdgeType<TObjectType extends ObjectType, TName extends string>(typeRef: TypeRef<TObjectType, TName>): Configuration<TConfigurationSchema & {
        edgeTypes: {
            readonly [key in TName]: TObjectType;
        };
    }>;
    setObjectType<TTypeName extends keyof TConfigurationSchema["objectTypes"]>(typeName: TTypeName, typeConfigurer: (tc: TypeConfiguration<TConfigurationSchema, TTypeName>) => void): this;
    buildStateManager(): StateManager<TConfigurationSchema["objectTypes"]>;
}
export declare function typeRefBuilder<TObjectType extends ObjectType>(): TypeRefBuilder<TObjectType>;
export interface TypeRefBuilder<TObjectType extends ObjectType> {
    named<TName extends string>(name?: TName): TypeRef<TObjectType, TName>;
    " $supressWarnings"(_1: TObjectType): void;
}
export interface TypeRef<TObjectType extends ObjectType, TName extends string> {
    readonly name: string;
    " $supressWarnings"(_1: TObjectType, _2: TName): void;
}
