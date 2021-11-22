import "reflect-metadata";
import { JsonController, Get, QueryParam } from 'routing-controllers';
import { bookTable, TBook } from "../dal/BookTable";

@JsonController()
export class BookController {

    @Get("/findBooksByStores")
    async findBooksByStores(
        @QueryParam("storeIds", {required: true}) storeIds: string,
        @QueryParam("name") name?: string
    ): Promise<TBook[]> {

        
        const storeIdArr = storeIds.split(",").map(id => id.trim()).filter(id => id !== '');
        const rows = bookTable.findByProp("storeId", storeIdArr);
        if (name !== undefined && name !== null && name !== "") {
            const pattern = name.toLowerCase();
            return rows.filter(row => row.name.toLowerCase().indexOf(pattern) !== -1)
        }
        return rows;
    }
}