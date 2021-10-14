import 'reflect-metadata';
import { Field, ObjectType } from 'type-graphql';
import { TBook } from '../../dal/BookRepository';
import { bookStoreTable, TBookStore } from '../../dal/BookStoreRepository';
import { BookStore } from './BookStore';

@ObjectType()
export class Book {

    @Field(() => String)
    readonly id: string;

    @Field(() => String)
    readonly name: string;

    readonly storeId?: string;

    constructor(row: TBook) {
        this.id = row.id;
        this.name = row.name;
        this.storeId = row.storeId;
    }

    @Field(() => BookStore, { nullable: true })
    store(): BookStore | undefined {
        if (this.storeId === undefined) {
            return undefined;
        }
        return new BookStore(bookStoreTable.findNonNullById(this.storeId));
    }
}
