import {ImplementationType} from '../CommonTypes';
import {BookStoreFlatType} from '../fetchers/BookStoreFetcher';

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
    TFieldName
;

export type BookStoreChangeEventFields = 
    "name" | 
    "books"
;
