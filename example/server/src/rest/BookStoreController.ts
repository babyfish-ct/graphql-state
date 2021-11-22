import "reflect-metadata";
import { JsonController, Get, QueryParam } from 'routing-controllers';
import { compare } from '../common/Comparator';
import { delay } from '../common/Delay';
import { bookStoreTable, TBookStore } from '../dal/BookStoreTable';
import { Predicate } from '../dal/Table';

@JsonController()
export class BookStoreController {

    @Get("/findBookStores")
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
}