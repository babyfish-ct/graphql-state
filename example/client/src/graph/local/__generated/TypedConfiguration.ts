import { Configuration, newConfiguration } from 'graphql-state';
import {
    bookStore$,
    book$,
    author$,
    query$
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
        bookStore$, 
        book$, 
        author$, 
        query$
    );
}

export type Schema = {
    readonly query: {
        readonly " $associationTypes": {
            readonly bookStores: "BookStore", 
            readonly books: "Book", 
            readonly authors: "Author"
        };
        readonly " $associationArgs": {
        };
        readonly " $associationTargetTypes": {
            readonly bookStores: BookStoreScalarType, 
            readonly books: BookScalarType, 
            readonly authors: AuthorScalarType
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
            };
            readonly " $associationTargetTypes": {
                readonly books: BookScalarType
            };
        };
    };
};
