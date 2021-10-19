import {ImplementationType} from '../CommonTypes';
import {BookFlatType} from '../fetchers/BookFetcher';

export interface BookChangeEvent {

    readonly typeName: ImplementationType<"Book">;

     readonly id: string;

    readonly changedType: "INSERT" | "UPDATE" | "DELETE";

    readonly changedKeys: ReadonlyArray<BookChangeEventKey<any>>;

    oldValue<TFieldName extends BookChangeEventFields>(
        key: BookChangeEventKey<TFieldName>
    ): BookFlatType[TFieldName] | undefined;

    newValue<TFieldName extends BookChangeEventFields>(
        key: BookChangeEventKey<TFieldName>
    ): BookFlatType[TFieldName] | undefined;
}

export type BookChangeEventKey<TFieldName extends BookChangeEventFields> = 
    TFieldName
;

export type BookChangeEventFields = 
    "name" | 
    "store" | 
    "authors"
;
