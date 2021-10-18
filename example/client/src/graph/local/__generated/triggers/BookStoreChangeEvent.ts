import {ImplementationType} from '../CommonTypes';

export interface BookStoreChangeEvent {

    readonly typeName: ImplementationType<"BookStore">;

     readonly id: string;

    readonly changedType: "INSERT" | "UPDATE" | "DELETE";

    readonly changedKeys: ReadonlyArray<BookStoreChangeEventKey<any>>;

    oldValue<TFieldName extends BookStoreChangeEventFields>(
        key: BookStoreChangeEventKey<TFieldName>
    ): BookStoreChangeEventValues[TFieldName] | undefined;

    newValue<TFieldName extends BookStoreChangeEventFields>(
        key: BookStoreChangeEventKey<TFieldName>
    ): BookStoreChangeEventValues[TFieldName] | undefined;
}

export type BookStoreChangeEventKey<TFieldName extends BookStoreChangeEventFields> = 
    TFieldName
;

export type BookStoreChangeEventFields = 
    "name" | 
    "books"
;

export interface BookStoreChangeEventValues {
    readonly name: string;
    readonly books: readonly {
        readonly id: string
    }[];
};