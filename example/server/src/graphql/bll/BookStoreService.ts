import 'reflect-metadata';
import { Arg, Query } from 'type-graphql';
import { Predicate } from '../../dal/Table';
import { BookStore } from '../model/BookStore';
import { delay } from '../../Delay';
import { bookStoreTable, TBookStore } from '../../dal/BookStoreTable';

export class BookStoreSerice {

    @Query(() => [BookStore])
    async findBooksStores(
        @Arg("name", () => String, {nullable: true}) name?: string | null
    ): Promise<BookStore[]> {

        /*
         * Mock the network delay
         */
        await delay(1000);

        const lowercaseName = name?.toLocaleLowerCase();
        const predicate: Predicate<TBookStore> | undefined = 
            lowercaseName !== undefined && lowercaseName !== "" ?
            d => d.name.toLowerCase().indexOf(lowercaseName) !== -1 :
            undefined;
        
        return bookStoreTable
            .find([], predicate)
            .map(row => new BookStore(row))
            .sort((a, b) => a.name > b.name ? + 1 : a.name < b.name ? -1 :0);
    }
}