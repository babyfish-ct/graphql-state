import { TAuthor } from "../../dal/AuthorTable";
import { PageInfo } from "./PageInfo";

export interface AuthorConnection {
    readonly totalCount: number;
    readonly edges: readonly AuthorEdge[];
    readonly pageInfo: PageInfo;
}

export interface AuthorEdge {
    readonly node: TAuthor;
    readonly cursor: string;
}