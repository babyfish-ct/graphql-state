import {ImplementationType} from '../CommonTypes';
import {BookStoreArgs, BookStoreFlatType} from '../fetchers/BookStoreFetcher';


export interface BookStoreEvictEvent {

    readonly eventType: "evict";

    readonly typeName: ImplementationType<"BookStore">;

    readonly id: string;

    readonly causedByGC: boolean;

    readonly evictedType: "row" | "fields";

    readonly evictedKeys: ReadonlyArray<BookStoreEntityKey<any>>;

    has(evictedKey: BookStoreEntityKey<any>): boolean;

    evictedValue<TFieldName extends BookStoreEntityFields>(
        key: BookStoreEntityKey<TFieldName>
    ): BookStoreFlatType[TFieldName] | undefined;
}

export interface BookStoreChangeEvent {

    readonly eventType: "change";

    readonly typeName: ImplementationType<"BookStore">;

    readonly id: string;

    readonly changedType: "insert" | "update" | "delete";

    readonly changedKeys: ReadonlyArray<BookStoreEntityKey<any>>;

    has(changedKey: BookStoreEntityKey<any>): boolean;

    oldValue<TFieldName extends BookStoreEntityFields>(
        key: BookStoreEntityKey<TFieldName>
    ): BookStoreFlatType[TFieldName] | undefined;

    newValue<TFieldName extends BookStoreEntityFields>(
        key: BookStoreEntityKey<TFieldName>
    ): BookStoreFlatType[TFieldName] | undefined;
}

export type BookStoreEntityKey<TFieldName extends BookStoreEntityFields> = 
    TFieldName extends "books" ? 
    { readonly name: "books"; readonly variables: BookStoreArgs } : 
    TFieldName
;

export type BookStoreEntityFields = 
    "name" | 
    "books"
;
