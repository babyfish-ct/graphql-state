import { EntityChangeEvent } from "..";

export interface SchemaType {
    readonly [key: string]: {
        readonly " $id": any;
        readonly " $event": EntityChangeEvent;
        readonly " $associations": {
            readonly [key: string]: string;
        }
    }
}