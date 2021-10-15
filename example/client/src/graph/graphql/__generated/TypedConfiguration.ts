import { Configuration, newConfiguration } from 'graphql-state';
import { query$ } from './fetchers';
import { bookStore$ } from './fetchers';
import { BookStoreChangeEvent } from './triggers';
import { book$ } from './fetchers';
import { BookChangeEvent } from './triggers';

export function newTypedConfiguration(): Configuration<Schema> {
    return newConfiguration<Schema>(
        query$, 
        bookStore$, 
        book$
    );
}

export type Schema = {
    readonly "BookStore": {
        readonly " $id": string;
        readonly " $event": BookStoreChangeEvent;
        readonly " $associations": {readonly books: "Book"};
    };
    readonly "Book": {
        readonly " $id": string;
        readonly " $event": BookChangeEvent;
        readonly " $associations": {readonly store: "BookStore"};
    };
}
