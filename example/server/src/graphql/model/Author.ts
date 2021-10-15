import 'reflect-metadata';
import { Field, ObjectType } from 'type-graphql';
import { bookTable } from '../../dal/BookTable';
import { Book } from './Book';
import { TAuthor } from '../../dal/AuthorTable';
import { bookAuthorMappingTable } from '../../dal/BookAuthorMappingTable';

@ObjectType()
export class Author {

    @Field(() => String)
    readonly id: string;

    @Field(() => String)
    readonly name: string;

    constructor(row: TAuthor) {
        this.id = row.id;
        this.name = row.name;
    }

    @Field(() => [Book])
    books(): Book[] {
        return bookAuthorMappingTable.findByProp("authorId", this.id).map(mapping =>
            new Book(bookTable.findNonNullById(mapping.bookId))
        );
    }
}
