import 'reflect-metadata';
import { Field, ObjectType } from 'type-graphql';
import { TBook } from '../../dal/BookTable';
import { bookStoreTable, TBookStore } from '../../dal/BookStoreTable';
import { BookStore } from './BookStore';
import { Author } from './Author';
import { bookAuthorMappingTable } from '../../dal/BookAuthorMappingTable';
import { authorTable } from '../../dal/AuthorTable';

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

    @Field(() => [Author])
    authors(): Author[] {
        return bookAuthorMappingTable.findByProp("bookId", this.id).map(mapping =>
            new Author(authorTable.findNonNullById(mapping.authorId))
        );
    }
}
