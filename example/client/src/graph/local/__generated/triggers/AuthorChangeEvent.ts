import {ImplementationType} from '../CommonTypes';
import {AuthorFlatType} from '../fetchers/AuthorFetcher';

export interface AuthorChangeEvent {

    readonly typeName: ImplementationType<"Author">;

     readonly id: string;

    readonly changedType: "INSERT" | "UPDATE" | "DELETE";

    readonly changedKeys: ReadonlyArray<AuthorChangeEventKey<any>>;

    oldValue<TFieldName extends AuthorChangeEventFields>(
        key: AuthorChangeEventKey<TFieldName>
    ): AuthorFlatType[TFieldName] | undefined;

    newValue<TFieldName extends AuthorChangeEventFields>(
        key: AuthorChangeEventKey<TFieldName>
    ): AuthorFlatType[TFieldName] | undefined;
}

export type AuthorChangeEventKey<TFieldName extends AuthorChangeEventFields> = 
    TFieldName
;

export type AuthorChangeEventFields = 
    "name" | 
    "books"
;
