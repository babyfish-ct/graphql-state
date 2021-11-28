export interface PageInfo {
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
    readonly startCursor: string;
    readonly endCursor: string;
}