import 'reflect-metadata';
import { Arg, Field, ObjectType } from 'type-graphql';
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
    books(@Arg("name", () => String, { nullable: true}) name?: string): Book[] {
        if (name === undefined || name === null || name === "") {
            return bookAuthorMappingTable.findByProp("authorId", this.id).map(mapping =>
                new Book(bookTable.findNonNullById(mapping.bookId))
            );
        }
        return bookAuthorMappingTable
            .findByProp("authorId", this.id)
            .map(mapping => {
                const rows = bookTable.find(
                    [{prop: "id", value: mapping.bookId}],
                    row => row.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
                );
                return rows.length !== 0 ? new Book(rows[0]) : undefined;
            })
            .filter(book => book !== undefined) as Book[]
        ;
    }
}
