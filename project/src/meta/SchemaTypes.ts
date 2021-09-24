import { Configuration } from "./Configuration"

export type SchemaOf<TConfiguration> =
    TConfiguration extends Configuration<infer TSchema> ?
    TSchema["objectTypes"] :
    never
;

export type SchemaTypes = {
    readonly [key:string]: ObjectType
};

export type ObjectType = { readonly [key: string]: any };

export interface ConfigurationSchemaTypes {
    readonly objectTypes: SchemaTypes,
    readonly collectionTypes: { readonly [key:string]: ObjectType },
    readonly edgeTypes: { readonly [key:string]: ObjectType }
};