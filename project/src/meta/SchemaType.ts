import { EntityChangeEvent } from "..";

export interface ScheamType {
    readonly [key: string]: {
        readonly " $id": any;
        readonly " $event": EntityChangeEvent;
        readonly " $associations": {
            readonly [key: string]: string;
        }
    }
}