import { Arg, Query } from "type-graphql";
import { delay } from "../../common/Delay";
import { authorTable } from "../../dal/AuthorTable";
import { bookStoreTable } from "../../dal/BookStoreTable";
import { bookTable } from "../../dal/BookTable";
import { Any } from "../model/Any";
import { Author } from "../model/Author";
import { Book } from "../model/Book";
import { BookStore } from "../model/BookStore";

export class EntityService {

    @Query(() => [Any])
    async entities(
        @Arg("typeName", () => String) typeName: string, 
        @Arg("ids", () => [String]) ids: ReadonlyArray<string>
    ): Promise<Any[]> {

        /*
         * Mock the network delay
         */
        await delay(1000);

        switch (typeName) {
            case "BookStore":
                return bookStoreTable.findByIds(ids).map(row => new BookStore(row));
            case "Book":
                return bookTable.findByIds(ids).map(row => new Book(row));
            case "Author":
                return authorTable.findByIds(ids).map(row => new Author(row));
            default:
                throw new Error(`Illegal entity type: ${typeName}`);
        }
    }
}