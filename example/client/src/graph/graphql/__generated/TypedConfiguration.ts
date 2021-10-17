import { Configuration, newConfiguration } from 'graphql-state';
import {
    query$,
    bookStore$,
    book$,
    author$
} from './fetchers';
import {
    QueryArgs,
    BookStoreArgs,
    BookArgs,
    AuthorArgs
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
        author$
    );
}

export type Schema = {
    readonly query: {
        readonly " $associationArgs": {
            readonly findBooksStores: QueryArgs["findBooksStores"], 
            readonly findBooks: QueryArgs["findBooks"], 
            readonly findAuthors: QueryArgs["findAuthors"]
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
        };
    };
};
