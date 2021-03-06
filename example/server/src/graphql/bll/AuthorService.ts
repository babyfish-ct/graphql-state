import { Arg, Int, Mutation, Query } from "type-graphql";
import UUIDClass from "uuidjs";
import { authorTable, TAuthor } from "../../dal/AuthorTable";
import { bookAuthorMappingTable } from "../../dal/BookAuthorMappingTable";
import { Predicate } from "../../dal/Table";
import { delay } from "../../common/Delay";
import { Author, AuthorConnection, AuthorEdge } from "../model/Author";
import { AuthorInput } from "../model/input/AuthorInput";
import { compare } from "../../common/Comparator";
import { createConnection } from "../../common/Connection";

export class AuthorService {

    @Query(() => AuthorConnection)
    async findAuthors(
        @Arg("name", () => String, {nullable: true}) name?: string | null,
        @Arg("first", () => Int, {nullable: true}) first?: number | null,
        @Arg("after", () => String, {nullable: true}) after?: string | null,
        @Arg("last", () => Int, {nullable: true}) last?: number | null,
        @Arg("before", () => String, {nullable: true}) before?: string | null
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
            .map(row => new Author(row))
            .sort((a, b) => compare(a.name, b.name));
        return createConnection<AuthorConnection, AuthorEdge, Author>({
            totalCount: authors.length,
            getNodes: (offset, count) => authors.slice(offset, offset + count),
            createConnection: (totalCount, edges, pageInfo) => new AuthorConnection(totalCount, edges, pageInfo),
            createEdge: (node, cursor) => new AuthorEdge(node, cursor),
            first,
            after,
            last,
            before
        });
    }

    @Mutation(() => Author)
    async mergeAuthor(
        @Arg("input", () => AuthorInput) input: AuthorInput
    ): Promise<Author> {

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

        return new Author(input);
    }

    @Mutation(() => String, { nullable: true })
    async deleteAuthor(
        @Arg("id", () => String) id: string
    ): Promise<string | undefined> {

        /*
         * Mock the network delay
         */
        await delay(1000);
        
        for (const oldMapping of bookAuthorMappingTable.findByProp("authorId", id)) {
            bookAuthorMappingTable.delete(oldMapping.id);
        }
        return authorTable.delete(id) !== 0 ? id : undefined;
    }
}