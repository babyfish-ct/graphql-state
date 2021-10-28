import { Arg, Int, Mutation, Query } from "type-graphql";
import UUIDClass from "uuidjs";
import { bookAuthorMappingTable } from "../../dal/BookAuthorMappingTable";
import { bookTable, TBook } from "../../dal/BookTable";
import { Predicate } from "../../dal/Table";
import { delay } from "../../common/Delay";
import { Book, BookConnection, BookEdge } from "../model/Book";
import { BookInput } from "../model/input/BookInput";
import { compare } from "../../common/Comparator";
import { createConnection } from "../../common/Connection";

export class BookSerice {

    @Query(() => BookConnection)
    async findBooks(
        @Arg("name", () => String, {nullable: true}) name?: string | null,
        @Arg("first", () => Int, {nullable: true}) first?: number | null,
        @Arg("after", () => String, {nullable: true}) after?: string | null,
        @Arg("last", () => Int, {nullable: true}) last?: number | null,
        @Arg("before", () => String, {nullable: true}) before?: string | null,
        @Arg("delayMillis", () => Int, {nullable: true}) delayMillis?: number | null
    ): Promise<BookConnection> {

        /*
         * Mock the network delay
         */
        await delay(delayMillis ?? 1000);

        const lowercaseName = name?.toLocaleLowerCase();
        const predicate: Predicate<TBook> | undefined = 
            lowercaseName !== undefined && lowercaseName !== "" ?
            d => d.name.toLowerCase().indexOf(lowercaseName) !== -1 :
            undefined;
        
        const books = bookTable
            .find([], predicate)
            .map(row => new Book(row))
            .sort((a, b) => compare(a.name, b.name));
        return createConnection<BookConnection, BookEdge, Book>({
            totalCount: books.length,
            getNodes: (offset, count) => books.slice(offset, offset + count),
            createConnection: (totalCount, edges, pageInfo) => new BookConnection(totalCount, edges, pageInfo),
            createEdge: (node, cursor) => new BookEdge(node, cursor),
            first,
            after,
            last,
            before
        });
    }

    @Mutation(() => Book)
    async mergeBook(
        @Arg("input", () => BookInput) input: BookInput
    ): Promise<Book> {

        /*
         * Mock the network delay
         */
        await delay(1000);

        bookTable.insert(input, true);
        for (const oldMapping of bookAuthorMappingTable.findByProp("bookId", input.id)) {
            bookAuthorMappingTable.delete(oldMapping.id);
        }
        for (const authorId of input.authorIds) {
            bookAuthorMappingTable.insert({
                id: UUIDClass.generate(),
                bookId: input.id,
                authorId
            });
        }

        return new Book(input);
    }

    @Mutation(() => String, { nullable: true })
    async deleteBook(
        @Arg("id", () => String) id: string
    ): Promise<string | undefined> {

        /*
         * Mock the network delay
         */
        await delay(1000);
        
        for (const oldMapping of bookAuthorMappingTable.findByProp("bookId", id)) {
            bookAuthorMappingTable.delete(oldMapping.id);
        }
        return bookTable.delete(id) !== 0 ? id : undefined;
    }
}