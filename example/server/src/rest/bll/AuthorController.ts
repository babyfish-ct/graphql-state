import "reflect-metadata";
import { JsonController, Get, QueryParam, Put, Body, Delete, Param } from 'routing-controllers';
import UUIDClass from "uuidjs";
import { compare } from "../../common/Comparator";
import { createConnection } from "../../common/Connection";
import { delay } from "../../common/Delay";
import { authorTable, TAuthor } from "../../dal/AuthorTable";
import { bookAuthorMappingTable } from "../../dal/BookAuthorMappingTable";
import { Predicate } from "../../dal/Table";
import { AuthorConnection, AuthorEdge } from "../model/AuthorConnnection";
import { AuthorInput } from "../model/AuthorInput";

@JsonController()
export class AuthorController {

    @Get("/authors")
    async findBooks(
        @QueryParam("name") name?: string,
        @QueryParam("first") first?: number,
        @QueryParam("after") after?: string,
        @QueryParam("last") last?: number,
        @QueryParam("before") before?: string
    ): Promise<AuthorConnection> {

        /*
         * Mock the network delay
         */
        await delay(1000);

        const lowercaseName = name?.toLocaleLowerCase();
        const predicate: Predicate<TAuthor> | undefined = 
            lowercaseName !== undefined && lowercaseName !== "" ?
            d => d.name.toLowerCase().indexOf(lowercaseName) !== -1 :
            undefined;
        
        const authors = authorTable
            .find([], predicate)
            .sort((a, b) => compare(a.name, b.name));
        return createConnection<AuthorConnection, AuthorEdge, TAuthor>({
            totalCount: authors.length,
            getNodes: (offset, count) => authors.slice(offset, offset + count),
            createConnection: (totalCount, edges, pageInfo) => ({ totalCount, edges, pageInfo }),
            createEdge: (node, cursor) => ({ node, cursor }),
            first,
            after,
            last,
            before
        });
    }

    @Get("/authorsOfBooks")
    async findAuthorsByBooks(
        @QueryParam("bookIds", {required: true}) bookIds: string,
        @QueryParam("name") name?: string
    ): Promise<Map<any, TAuthor[]>> {
        
        /*
         * Mock the network delay
         */
        await delay(1000);

        let predicate: Predicate<TAuthor> | undefined = undefined; 
        if (name !== undefined && name !== null && name !== "") {
            const pattern = name.toLowerCase();
            predicate = row => row.name.toLowerCase().indexOf(pattern) !== -1;
        }

        const map = new Map<string, TAuthor[]>();
        const bookIdArr = bookIds.split(/\s*,\s*/).filter(id => id !== '');
        for (const bookId of bookIdArr) {
            const authorIds = bookAuthorMappingTable
                .findByProp("bookId", bookId)
                .map(mapping => mapping.authorId);
            map.set(
                bookId, 
                authorTable
                .find([{prop: "id", value: authorIds}], predicate)
                .sort((a, b) => compare(a.name, b.name))
            );
        }

        return map;
    }

    @Put("/author")
    async saveAuthor(@Body() input: AuthorInput): Promise<boolean> {

        /*
         * Mock the network delay
         */
        await delay(1000);

        authorTable.insert(input, true);
        for (const oldMapping of bookAuthorMappingTable.findByProp("authorId", input.id)) {
            bookAuthorMappingTable.delete(oldMapping.id);
        }
        for (const bookId of input.bookIds) {
            bookAuthorMappingTable.insert({
                id: UUIDClass.generate(),
                bookId,
                authorId: input.id
            });
        }
        return true;
    }

    @Delete("/author/:id")
    async deleteAuthor(@Param("id") id: string): Promise<boolean> {

        /*
         * Mock the network delay
         */
        await delay(1000);
        
        for (const oldMapping of bookAuthorMappingTable.findByProp("authorId", id)) {
            bookAuthorMappingTable.delete(oldMapping.id);
        }
        return authorTable.delete(id) !== 0;
    }
}