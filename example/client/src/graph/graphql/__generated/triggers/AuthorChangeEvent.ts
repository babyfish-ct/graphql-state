import {ImplementationType} from '../CommonTypes';
import {AuthorArgs} from '../fetchers/AuthorFetcher';

export interface AuthorChangeEvent {

    readonly typeName: ImplementationType<"Author">;

     readonly id: string;

    readonly changedType: "INSERT" | "UPDATE" | "DELETE";

    readonly changedKeys: ReadonlyArray<AuthorChangeEventKey<any>>;

    oldValue<TFieldName extends AuthorChangeEventFields>(
        key: AuthorChangeEventKey<TFieldName>
    ): AuthorChangeEventValues[TFieldName] | undefined;

    newValue<TFieldName extends AuthorChangeEventFields>(
        key: AuthorChangeEventKey<TFieldName>
    ): AuthorChangeEventValues[TFieldName] | undefined;
}

export type AuthorChangeEventKey<TFieldName extends AuthorChangeEventFields> = 
    TFieldName extends "books" ? 
    { readonly name: "books"; readonly variables: AuthorArgs } : 
    TFieldName
;

export type AuthorChangeEventFields = 
    "name" | 
    "books"
;

export interface AuthorChangeEventValues {
    readonly name: string;
    readonly books: readonly {
        readonly id: string
    }[];
};
