/**
 * @author ChenTao
 * 
 * Server-side of example of 'graphql-state'
 */

import { Table } from "./Table";

export const bookStoreTable =
    new Table<TBookStore>({
        name: "book_store",
        idProp: "id",
        uniqueIndexs: ["name"]
    })
    .batchInsert([
        {id: "d38c10da-6be8-4924-b9b9-5e81899612a0", name: "O'REILLY"},
        {id: "2fa3955e-3e83-49b9-902e-0465c109c779", name: "MANNING"}
    ]);

export interface TBookStore {
    readonly id: string;
    readonly name: string;
}