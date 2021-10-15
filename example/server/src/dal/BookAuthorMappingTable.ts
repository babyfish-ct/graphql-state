import { authorTable } from "./AuthorTable";
import { bookTable } from "./BookTable";
import { ForeignKeys, Table } from "./Table";

export const bookAuthorMappingTable =
    new Table<TBookAuthorMapping>({
        name: "Author",
        idProp: "id",
        foreignKeys: new ForeignKeys<TBookAuthorMapping>()
            .add("bookId", bookTable)
            .add("authorId", authorTable)
    })
    .batchInsert([
        {
            id: "76da923f-bc60-4f58-a9dc-5dd2ea299fc3", 
            bookId: "e110c564-23cc-4811-9e81-d587a13db634",
            authorId: "fd6bb6cf-336d-416c-8005-1ae11a6694b5"
        },
        {
            id: "4eb24d17-4b14-44cf-9dcd-735744aa4bb3", 
            bookId: "e110c564-23cc-4811-9e81-d587a13db634",
            authorId: "1e93da94-af84-44f4-82d1-d8a9fd52ea94"
        },
        {
            id: "e2053a0d-3ce3-44a6-b1bb-61e7ac4445fb",
            bookId: "8f30bc8a-49f9-481d-beca-5fe2d147c831",
            authorId: "c14665c8-c689-4ac7-b8cc-6f065b8d835d"
        },
        {
            id: "42bdcf8d-9914-4dd4-9965-448b627eda1f",
            bookId: "914c8595-35cb-4f67-bbc7-8029e9e6245a",
            authorId: "718795ad-77c1-4fcf-994a-fec6a5a11f0f"
        },
        {
            id: "c16ca488-491a-4eb5-bdb0-317863ceb3fc",
            bookId: "a62f7aa3-9490-4612-98b5-98aae0e77120",
            authorId: "eb4963fd-5223-43e8-b06b-81e6172ee7ae"
        }
    ]);

export interface TBookAuthorMapping {
    readonly id: string;
    readonly bookId: string;
    readonly authorId: string;
}