import {ImplementationType} from '../CommonTypes';
import {AuthorFlatType} from '../fetchers/AuthorFetcher';


export interface AuthorEvictEvent {

    readonly typeName: ImplementationType<"Author">;

     readonly id: string;

    readonly evictedType: "row" | "fields";

    readonly evictedKeys: ReadonlyArray<AuthorEntityKey<any>>;

    has(evictedKey: AuthorEntityKey<any>): boolean;

    evictedValue<TFieldName extends AuthorEntityFields>(
        key: AuthorEntityKey<TFieldName>
    ): AuthorFlatType[TFieldName] | undefined;
}

export interface AuthorChangeEvent {

    readonly typeName: ImplementationType<"Author">;

     readonly id: string;

    readonly changedType: "insert" | "update" | "delete";

    readonly changedKeys: ReadonlyArray<AuthorEntityKey<any>>;

    has(changedKey: AuthorEntityKey<any>): boolean;

    oldValue<TFieldName extends AuthorEntityFields>(
        key: AuthorEntityKey<TFieldName>
    ): AuthorFlatType[TFieldName] | undefined;

    newValue<TFieldName extends AuthorEntityFields>(
        key: AuthorEntityKey<TFieldName>
    ): AuthorFlatType[TFieldName] | undefined;
}

export type AuthorEntityKey<TFieldName extends AuthorEntityFields> = 
    TFieldName
;

export type AuthorEntityFields = 
    "name" | 
    "books"
;
