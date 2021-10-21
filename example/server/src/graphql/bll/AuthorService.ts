import { Arg, Mutation, Query } from "type-graphql";
import UUIDClass from "uuidjs";
import { authorTable, TAuthor } from "../../dal/AuthorTable";
import { bookAuthorMappingTable } from "../../dal/BookAuthorMappingTable";
import { Predicate } from "../../dal/Table";
import { delay } from "../../common/Delay";
import { Author } from "../model/Author";
import { AuthorInput } from "../model/input/AuthorInput";

export class AuthorService {

    @Query(() => [Author])
    async findAuthors(
        @Arg("name", () => String, {nullable: true}) name?: string | null
    ): Promise<Author[]> {

        /*
         * Mock the network delay
         */
        await delay(1000);

        const lowercaseName = name?.toLocaleLowerCase();
        const predicate: Predicate<TAuthor> | undefined = 
            lowercaseName !== undefined && lowercaseName !== "" ?
            d => d.name.toLowerCase().indexOf(lowercaseName) !== -1 :
            undefined;
        
        return authorTable
            .find([], predicate)
            .map(row => new Author(row))
            .sort((a, b) => a.name > b.name ? + 1 : a.name < b.name ? -1 :0);
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
}