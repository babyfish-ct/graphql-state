import { Configuration, newConfiguration } from 'graphql-state';
import { bookStore$ } from './fetchers';
import { BookStoreChangeEvent } from './triggers';
import { book$ } from './fetchers';
import { BookChangeEvent } from './triggers';
import { author$ } from './fetchers';
import { AuthorChangeEvent } from './triggers';

export function newTypedConfiguration(): Configuration<Schema> {
    return newConfiguration<Schema>(
        bookStore$, 
        book$, 
        author$
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
        readonly " $associations": {
            readonly store: "BookStore", 
            readonly authors: "Author"
        };
    };
    readonly "Author": {
        readonly " $id": string;
        readonly " $event": AuthorChangeEvent;
        readonly " $associations": {readonly books: "Book"};
    };
}
