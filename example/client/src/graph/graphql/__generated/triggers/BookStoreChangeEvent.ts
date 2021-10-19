import {ImplementationType} from '../CommonTypes';
import {BookStoreArgs, BookStoreFlatType} from '../fetchers/BookStoreFetcher';

export interface BookStoreChangeEvent {

    readonly typeName: ImplementationType<"BookStore">;

     readonly id: string;

    readonly changedType: "INSERT" | "UPDATE" | "DELETE";

    readonly changedKeys: ReadonlyArray<BookStoreChangeEventKey<any>>;

    oldValue<TFieldName extends BookStoreChangeEventFields>(
        key: BookStoreChangeEventKey<TFieldName>
    ): BookStoreFlatType[TFieldName] | undefined;

    newValue<TFieldName extends BookStoreChangeEventFields>(
        key: BookStoreChangeEventKey<TFieldName>
    ): BookStoreFlatType[TFieldName] | undefined;
}

export type BookStoreChangeEventKey<TFieldName extends BookStoreChangeEventFields> = 
    TFieldName extends "books" ? 
    { readonly name: "books"; readonly variables: BookStoreArgs } : 
    TFieldName
;

export type BookStoreChangeEventFields = 
    "name" | 
    "books"
;
