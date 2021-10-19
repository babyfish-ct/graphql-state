import 'reflect-metadata';
import { Arg, Mutation, Query } from 'type-graphql';
import { Predicate } from '../../dal/Table';
import { BookStore } from '../model/BookStore';
import { delay } from '../../Delay';
import { bookStoreTable, TBookStore } from '../../dal/BookStoreTable';
import { BookStoreInput } from '../model/input/BookStoreInput';
import { bookTable } from '../../dal/BookTable';

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

    @Mutation(() => BookStore)
    async mergeBookStore(
        @Arg("input", () => BookStoreInput) input: BookStoreInput
    ): Promise<BookStore> {

        /*
         * Mock the network delay
         */
        await delay(1000);

        bookStoreTable.insert(input, true);
        
        for (const oldBook of bookTable.findByProp("storeId", input.id)) {
            bookTable.update({...oldBook, storeId: undefined});
        }
        for (const newBook of bookTable.findByIds(input.bookIds)) {
            bookTable.update({...newBook, storeId: input.id});
        }
        return new BookStore(input);
    }

    @Mutation(() => String, { nullable: true })
    async deleteBookStore(
        @Arg("id", () => String) id: string
    ): Promise<string | undefined> {

        /*
         * Mock the network delay
         */
        await delay(1000);
        
        for (const oldBook of bookTable.findByProp("storeId", id)) {
            bookTable.update({...oldBook, storeId: undefined});
        }
        return bookStoreTable.delete(id) !== 0 ? id : undefined;
    }
}