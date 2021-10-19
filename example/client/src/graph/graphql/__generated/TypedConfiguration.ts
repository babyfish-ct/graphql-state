import { Configuration, newConfiguration } from 'graphql-state';
import {
    query$,
    bookStore$,
    book$,
    author$,
    mutation$
} from './fetchers';
import {
    QueryArgs,
    BookStoreArgs,
    BookArgs,
    AuthorArgs
} from './fetchers';
import {
    BookStoreScalarType,
    BookScalarType,
    AuthorScalarType
} from './fetchers';
import {
    BookStoreChangeEvent,
    BookChangeEvent,
    AuthorChangeEvent
} from './triggers';

export function newTypedConfiguration(): Configuration<Schema> {
    return newConfiguration<Schema>(
        query$, 
        bookStore$, 
        book$, 
        author$, 
        mutation$
    );
}

export type Schema = {
    readonly query: {
        readonly " $associationTypes": {
            readonly findBooksStores: "BookStore", 
            readonly findBooks: "Book", 
            readonly findAuthors: "Author"
        };
        readonly " $associationArgs": {
            readonly findBooksStores: QueryArgs["findBooksStores"], 
            readonly findBooks: QueryArgs["findBooks"], 
            readonly findAuthors: QueryArgs["findAuthors"]
        };
        readonly " $associationTargetTypes": {
            readonly findBooksStores: BookStoreScalarType, 
            readonly findBooks: BookScalarType, 
            readonly findAuthors: AuthorScalarType
        };
    };
    readonly entities: {
        readonly "BookStore": {
            readonly " $id": string;
            readonly " $event": BookStoreChangeEvent;
            readonly " $associationTypes": {
                readonly books: "Book"
            };
            readonly " $associationArgs": {
                readonly books: BookStoreArgs["books"]
            };
            readonly " $associationTargetTypes": {
                readonly books: BookScalarType
            };
        };
        readonly "Book": {
            readonly " $id": string;
            readonly " $event": BookChangeEvent;
            readonly " $associationTypes": {
                readonly store: "BookStore", 
                readonly authors: "Author"
            };
            readonly " $associationArgs": {
                readonly authors: BookArgs["authors"]
            };
            readonly " $associationTargetTypes": {
                readonly store: BookStoreScalarType, 
                readonly authors: AuthorScalarType
            };
        };
        readonly "Author": {
            readonly " $id": string;
            readonly " $event": AuthorChangeEvent;
            readonly " $associationTypes": {
                readonly books: "Book"
            };
            readonly " $associationArgs": {
                readonly books: AuthorArgs["books"]
            };
            readonly " $associationTargetTypes": {
                readonly books: BookScalarType
            };
        };
    };
};
