import "reflect-metadata";
import { JsonController, Get, Put, QueryParam, Body, Delete, Param } from 'routing-controllers';
import { compare } from '../../common/Comparator';
import { delay } from '../../common/Delay';
import { bookStoreTable, TBookStore } from '../../dal/BookStoreTable';
import { bookTable } from "../../dal/BookTable";
import { Predicate } from '../../dal/Table';
import { BookStoreInput } from "../model/BookStoreInput";

@JsonController()
export class BookStoreController {

    @Get("/bookStores")
    async findBookStores(@QueryParam("name") name?: string): Promise<TBookStore[]> {
        
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
            .sort((a, b) => compare(a.name, b.name));
    }

    @Get("/bookStoresOfBooks")
    async findBookStoresByBooks(
        @QueryParam("bookIds", {required: true}) bookIds: string
    ): Promise<Map<string, TBookStore>> {

        /*
         * Mock the network delay
         */
        await delay(1000);
            
        const map = new Map<string, TBookStore>();
        const bookIdArr = bookIds.split(/\s*,\s*/).filter(id => id !== '');
        for (const bookId of bookIdArr) {
            const book = bookTable.findByUniqueProp("id", bookId);
            if (book?.storeId !== undefined) {
                const bookStore = bookStoreTable.findByUniqueProp("id", book.storeId);
                if (bookStore !== undefined) {
                    map.set(book.id, bookStore);
                }
            }
        }

        return map;
    }

    @Put("/bookStore")
    async saveBookStore(@Body() input: BookStoreInput): Promise<boolean> {

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
        return true;
    }

    @Delete("/bookStore/:id")
    async deleteBookStore(@Param("id") id: string): Promise<boolean> {
        
        /*
         * Mock the network delay
         */
        await delay(1000);
        
        for (const oldBook of bookTable.findByProp("storeId", id)) {
            bookTable.update({...oldBook, storeId: undefined});
        }
        return bookStoreTable.delete(id) !== 0;
    }
}