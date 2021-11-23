import { TBook } from "../../dal/BookTable";
import { PageInfo } from "./PageInfo";

export interface BookConnection {
    readonly totalCount: number;
    readonly edges: readonly BookEdge[];
    readonly pageInfo: PageInfo;
}

export interface BookEdge {
    readonly node: TBook;
    readonly cursor: string;
}