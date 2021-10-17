import { Configuration, newConfiguration } from 'graphql-state';
import {
    bookStore$,
    book$,
    author$,
    query$
} from './fetchers';
import {
    BookStoreChangeEvent,
    BookChangeEvent,
    AuthorChangeEvent
} from './triggers';

export function newTypedConfiguration(): Configuration<Schema> {
    return newConfiguration<Schema>(
        bookStore$, 
        book$, 
        author$, 
        query$
    );
}

export type Schema = {
    readonly query: {
        readonly " $associationArgs": {
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
            };
        };
        readonly "Author": {
            readonly " $id": string;
            readonly " $event": AuthorChangeEvent;
            readonly " $associationTypes": {
                readonly books: "Book"
            };
            readonly " $associationArgs": {
            };
        };
    };
};
