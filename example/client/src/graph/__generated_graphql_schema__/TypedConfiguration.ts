import { Configuration, newConfiguration } from 'graphql-state';
import {
    query$,
    bookStore$,
    any$,
    book$,
    author$,
    bookConnection$,
    bookEdge$,
    pageInfo$,
    authorConnection$,
    authorEdge$,
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
    BookStoreEvictEvent,
    BookStoreChangeEvent,
    BookEvictEvent,
    BookChangeEvent,
    AuthorEvictEvent,
    AuthorChangeEvent
} from './triggers';

export function newTypedConfiguration(): Configuration<Schema> {
    return newConfiguration<Schema>(
        query$, 
        bookStore$, 
        any$, 
        book$, 
        author$, 
        bookConnection$, 
        bookEdge$, 
        pageInfo$, 
        authorConnection$, 
        authorEdge$, 
        mutation$
    );
}

export type Schema = {
    readonly query: {
        readonly " $associationTypes": {
            readonly findBookStores: "BookStore", 
            readonly findBooks: "Book", 
            readonly findAuthors: "Author", 
            readonly entities: "Any"
        };
        readonly " $associationArgs": {
            readonly findBookStores: QueryArgs["findBookStores"], 
            readonly findBooks: QueryArgs["findBooks"], 
            readonly findAuthors: QueryArgs["findAuthors"], 
            readonly entities: QueryArgs["entities"]
        };
        readonly " $associationTargetTypes": {
            readonly findBookStores: BookStoreScalarType, 
            readonly findBooks: BookScalarType, 
            readonly findAuthors: AuthorScalarType
        };
    };
    readonly entities: {
        readonly "BookStore": {
            readonly " $id": string;
            readonly " $evictEvent": BookStoreEvictEvent;
            readonly " $changeEvent": BookStoreChangeEvent;
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
            readonly " $evictEvent": BookEvictEvent;
            readonly " $changeEvent": BookChangeEvent;
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
            readonly " $evictEvent": AuthorEvictEvent;
            readonly " $changeEvent": AuthorChangeEvent;
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
