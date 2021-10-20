import {ImplementationType} from '../CommonTypes';
import {AuthorArgs, AuthorFlatType} from '../fetchers/AuthorFetcher';


export interface AuthorEvictEvent {

    readonly typeName: ImplementationType<"Author">;

     readonly id: string;

    readonly evictedType: "row" | "fields";

    readonly evictedKeys: ReadonlyArray<AuthorEntityKey<any>>;

    evictedValue<TFieldName extends AuthorEntityFields>(
        key: AuthorEntityKey<TFieldName>
    ): AuthorFlatType[TFieldName] | undefined;
}

export interface AuthorChangeEvent {

    readonly typeName: ImplementationType<"Author">;

     readonly id: string;

    readonly changedType: "insert" | "update" | "delete";

    readonly changedKeys: ReadonlyArray<AuthorEntityKey<any>>;

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
