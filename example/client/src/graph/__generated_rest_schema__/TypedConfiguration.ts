import { Configuration, newConfiguration } from 'graphql-state';
import {
    bookStore$,
    book$,
    author$,
    query$,
    pageInfo$,
    bookConnection$,
    bookEdge$,
    authorConnection$,
    authorEdge$
} from './fetchers';
import {
    BookStoreArgs,
    BookArgs,
    AuthorArgs,
    QueryArgs
} from './fetchers';
import {
    BookStoreFlatType,
    BookFlatType,
    AuthorFlatType
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
        bookStore$, 
        book$, 
        author$, 
        query$, 
        pageInfo$, 
        bookConnection$, 
        bookEdge$, 
        authorConnection$, 
        authorEdge$
    );
}

export type Schema = {
    readonly query: {
        readonly " $associationTypes": {
            readonly findBookStores: "BookStore", 
            readonly findBooks: "Book", 
            readonly findAuthors: "Author"
        };
        readonly " $associationArgs": {
            readonly findBookStores: QueryArgs["findBookStores"], 
            readonly findBooks: QueryArgs["findBooks"], 
            readonly findAuthors: QueryArgs["findAuthors"]
        };
        readonly " $associationTargetTypes": {
            readonly findBookStores: BookStoreFlatType, 
            readonly findBooks: BookFlatType, 
            readonly findAuthors: AuthorFlatType
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
                readonly books: BookFlatType
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
                readonly store: BookStoreFlatType, 
                readonly authors: AuthorFlatType
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
                readonly books: BookFlatType
            };
        };
    };
};
