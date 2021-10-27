import {ImplementationType} from '../CommonTypes';
import {AuthorArgs, AuthorFlatType} from '../fetchers/AuthorFetcher';


export interface AuthorEvictEvent {

    readonly eventType: "evict";

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

    readonly eventType: "change";

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
    TFieldName extends "books" ? 
    { readonly name: "books"; readonly variables: AuthorArgs } : 
    TFieldName
;

export type AuthorEntityFields = 
    "name" | 
    "books"
;
