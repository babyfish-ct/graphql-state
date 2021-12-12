import {ImplementationType} from '../CommonTypes';
import {BookFlatType} from '../fetchers/BookFetcher';


export interface BookEvictEvent {

    readonly eventType: "evict";

    readonly typeName: ImplementationType<"Book">;

    readonly id: string;

    readonly causedByGC: boolean;

    readonly evictedType: "row" | "fields";

    readonly evictedKeys: ReadonlyArray<BookEntityKey<any>>;

    has(evictedKey: BookEntityKey<any>): boolean;

    evictedValue<TFieldName extends BookEntityFields>(
        key: BookEntityKey<TFieldName>
    ): BookFlatType[TFieldName] | undefined;
}

export interface BookChangeEvent {

    readonly eventType: "change";

    readonly typeName: ImplementationType<"Book">;

    readonly id: string;

    readonly changedType: "insert" | "update" | "delete";

    readonly changedKeys: ReadonlyArray<BookEntityKey<any>>;

    has(changedKey: BookEntityKey<any>): boolean;

    oldValue<TFieldName extends BookEntityFields>(
        key: BookEntityKey<TFieldName>
    ): BookFlatType[TFieldName] | undefined;

    newValue<TFieldName extends BookEntityFields>(
        key: BookEntityKey<TFieldName>
    ): BookFlatType[TFieldName] | undefined;
}

export type BookEntityKey<TFieldName extends BookEntityFields> = 
    TFieldName
;

export type BookEntityFields = 
    "name" | 
    "store" | 
    "authors"
;
