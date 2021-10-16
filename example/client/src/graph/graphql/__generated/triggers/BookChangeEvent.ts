import {ImplementationType} from '../CommonTypes';
import {BookArgs} from '../fetchers/BookFetcher';

export interface BookChangeEvent {

    readonly typeName: ImplementationType<"Book">;

     readonly id: string;

    readonly changedType: "INSERT" | "UPDATE" | "DELETE";

    readonly changedKeys: ReadonlyArray<BookChangeEventKey<any>>;

    oldValue<TFieldName extends BookChangeEventFields>(
        key: BookChangeEventKey<TFieldName>
    ): BookChangeEventValues[TFieldName] | undefined;

    newValue<TFieldName extends BookChangeEventFields>(
        key: BookChangeEventKey<TFieldName>
    ): BookChangeEventValues[TFieldName] | undefined;
}

export type BookChangeEventKey<TFieldName extends BookChangeEventFields> = 
    TFieldName extends "authors" ? 
    { readonly name: "authors"; readonly variables: BookArgs } : 
    TFieldName
;

export type BookChangeEventFields = 
    "name" | 
    "store" | 
    "authors"
;

export interface BookChangeEventValues {
    readonly name: string;
    readonly store: {
        readonly id: string
    };
    readonly authors: readonly {
        readonly id: string
    }[];
};
