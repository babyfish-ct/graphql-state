import { Arg, Query } from "type-graphql";
import { bookTable, TBook } from "../../dal/BookTable";
import { Predicate } from "../../dal/Table";
import { delay } from "../../Delay";
import { Book } from "../model/Book";

export class BookSerice {

    @Query(() => [Book])
    async findBooks(
        @Arg("name", () => String, {nullable: true}) name?: string | null
    ): Promise<Book[]> {

        /*
         * Mock the network delay
         */
        await delay(1000);

        const lowercaseName = name?.toLocaleLowerCase();
        const predicate: Predicate<TBook> | undefined = 
            lowercaseName !== undefined && lowercaseName !== "" ?
            d => d.name.toLowerCase().indexOf(lowercaseName) !== -1 :
            undefined;
        
        return bookTable
            .find([], predicate)
            .map(row => new Book(row))
            .sort((a, b) => a.name > b.name ? + 1 : a.name < b.name ? -1 :0);
    }
}