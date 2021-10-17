import { EntityChangeEvent } from "..";
export interface SchemaType {
    readonly query: {
        readonly " $associationArgs": {
            readonly [key: string]: {
                readonly [key: string]: any;
            };
        };
    };
    readonly entities: {
        readonly [key: string]: {
            readonly " $id": any;
            readonly " $event": EntityChangeEvent;
            readonly " $associationTypes": {
                readonly [key: string]: string;
            };
            readonly " $associationArgs": {
                readonly [key: string]: any;
            };
        };
    };
}
export interface EmptySchemaType {
    readonly query: {
        readonly " $associationArgs": {};
    };
    readonly entities: {};
}
