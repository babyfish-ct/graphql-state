import "reflect-metadata";
import { JsonController, Get, QueryParam, Put, Body, Delete, Param } from 'routing-controllers';
import UUIDClass from "uuidjs";
import { compare } from "../../common/Comparator";
import { createConnection } from "../../common/Connection";
import { delay } from "../../common/Delay";
import { bookAuthorMappingTable } from "../../dal/BookAuthorMappingTable";
import { bookTable, TBook } from "../../dal/BookTable";
import { Predicate } from "../../dal/Table";
import { BookConnection, BookEdge } from "../model/BookConnection";
import { BookInput } from "../model/BookInput";

@JsonController()
export class BookController {

    @Get("/books")
    async findBooks(
        @QueryParam("name") name?: string,
        @QueryParam("first") first?: number,
        @QueryParam("after") after?: string,
        @QueryParam("last") last?: number,
        @QueryParam("before") before?: string
    ): Promise<BookConnection> {

        /*
         * Mock the network delay
         */
        await delay(1000);

        const lowercaseName = name?.toLocaleLowerCase();
        const predicate: Predicate<TBook> | undefined = 
            lowercaseName !== undefined && lowercaseName !== "" ?
            d => d.name.toLowerCase().indexOf(lowercaseName) !== -1 :
            undefined;
        
        const books = bookTable
            .find([], predicate)
            .sort((a, b) => compare(a.name, b.name));
        return createConnection<BookConnection, BookEdge, TBook>({
            totalCount: books.length,
            getNodes: (offset, count) => books.slice(offset, offset + count),
            createConnection: (totalCount, edges, pageInfo) => ({ totalCount, edges, pageInfo }),
            createEdge: (node, cursor) => ({ node, cursor }),
            first,
            after,
            last,
            before
        });
    }

    @Get("/booksOfStores")
    async findBooksByStores(
        @QueryParam("storeIds", {required: true}) storeIds: string,
        @QueryParam("name") name?: string
    ): Promise<TBook[]> {

        /*
         * Mock the network delay
         */
        await delay(1000);
        
        let predicate: Predicate<TBook> | undefined = undefined; 
        if (name !== undefined && name !== null && name !== "") {
            const pattern = name.toLowerCase();
            predicate = row => row.name.toLowerCase().indexOf(pattern) !== -1;
        }

        const storeIdArr = storeIds.split(/\s*,\s*/).filter(id => id !== '');
        const rows = bookTable.find([{prop: "storeId", value: storeIdArr}], predicate);
        return rows.sort((a, b) => compare(a.name, b.name));
    }

    @Get("/booksOfAuthors")
    async findBooksByAuthors(
        @QueryParam("authorIds", {required: true}) authorIds: string,
        @QueryParam("name") name?: string
    ): Promise<Map<any, TBook[]>> {
        
        /*
         * Mock the network delay
         */
        await delay(1000);

        let predicate: Predicate<TBook> | undefined = undefined; 
        if (name !== undefined && name !== null && name !== "") {
            const pattern = name.toLowerCase();
            predicate = row => row.name.toLowerCase().indexOf(pattern) !== -1;
        }

        const map = new Map<string, TBook[]>();
        const authorIdArr = authorIds.split(/\s*,\s*/).filter(id => id !== '');
        for (const authorId of authorIdArr) {
            const bookIds = bookAuthorMappingTable
                .findByProp("authorId", authorId)
                .map(mapping => mapping.bookId);
            map.set(
                authorId, 
                bookTable
                .find([{prop: "id", value: bookIds}], predicate)
                .sort((a, b) => compare(a.name, b.name))
            );
        }

        return map;
    }

    @Put("/book")
    async mergeBook(@Body() input: BookInput): Promise<boolean> {

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
        return true;
    }

    @Delete("/book/:id")
    async deleteBook(@Param("id") id: string): Promise<boolean> {

        /*
         * Mock the network delay
         */
        await delay(1000);
        
        for (const oldMapping of bookAuthorMappingTable.findByProp("bookId", id)) {
            bookAuthorMappingTable.delete(oldMapping.id);
        }
        return bookTable.delete(id) !== 0;
    }
}