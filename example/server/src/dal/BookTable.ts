import { bookStoreTable } from "./BookStoreTable";
import { ForeignKeys, Table } from "./Table";

export const bookTable =
    new Table<TBook>({
        name: 'employee',
        idProp: "id",
        indexes: ["storeId"],
        foreignKeys: new ForeignKeys<TBook>()
            .add("storeId", bookStoreTable)
    })
    .batchInsert([
        {
            id: "e110c564-23cc-4811-9e81-d587a13db634", 
            name: "Learning GraphQL", 
            storeId: "d38c10da-6be8-4924-b9b9-5e81899612a0"
        },
        {
            id: "8f30bc8a-49f9-481d-beca-5fe2d147c831", 
            name: "Effective TypeScript", 
            storeId: "d38c10da-6be8-4924-b9b9-5e81899612a0"
        },
        {
            id: "914c8595-35cb-4f67-bbc7-8029e9e6245a", 
            name: "Programming TypeScript", 
            storeId: "d38c10da-6be8-4924-b9b9-5e81899612a0"
        },
        {
            id: "a62f7aa3-9490-4612-98b5-98aae0e77120", 
            name: "GraphQL in Action",
            storeId: "2fa3955e-3e83-49b9-902e-0465c109c779"
        }
    ]);

export interface TBook {
    readonly id: string;
    readonly name: string;
    readonly storeId?: string;
}