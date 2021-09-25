import { Configuration } from "./Configuration";
export declare type SchemaOf<TConfiguration> = TConfiguration extends Configuration<infer TSchema> ? TSchema["objectTypes"] : never;
export declare type SchemaTypes = {
    readonly [key: string]: ObjectType;
};
export declare type ObjectType = {
    readonly [key: string]: any;
};
export interface ConfigurationSchemaTypes {
    readonly objectTypes: SchemaTypes;
    readonly collectionTypes: SchemaTypes;
    readonly edgeTypes: SchemaTypes;
}
