import { Table } from "./Table";

export const authorTable =
    new Table<TAuthor>({
        name: "Author",
        idProp: "id",
        uniqueIndexs: ["name"]
    })
    .batchInsert([
        {id: "fd6bb6cf-336d-416c-8005-1ae11a6694b5", name: "Eve Procello"},
        {id: "1e93da94-af84-44f4-82d1-d8a9fd52ea94", name: "Alex Banks"},
        {id: "c14665c8-c689-4ac7-b8cc-6f065b8d835d", name: "Dan Vanderkam"},
        {id: "718795ad-77c1-4fcf-994a-fec6a5a11f0f", name: "Boris Cherny"},
        {id: "eb4963fd-5223-43e8-b06b-81e6172ee7ae", name: "Samer Buna"},
    ]);

export interface TAuthor {
    readonly id: string;
    readonly name: string;
}