import 'reflect-metadata';
import { Field, ObjectType } from 'type-graphql';
import { bookTable } from '../../dal/BookRepository';
import { TBookStore } from '../../dal/BookStoreRepository';
import { Book } from './Book';

@ObjectType()
export class BookStore {

    @Field(() => String)
    readonly id: string;

    @Field(() => String)
    readonly name: string;

    constructor(row: TBookStore) {
        this.id = row.id;
        this.name = row.name;
    }

    @Field(() => [Book])
    books(): Book[] {
        return bookTable
            .findByProp("storeId", this.id)
            .map(row => new Book(row));
    }
}
