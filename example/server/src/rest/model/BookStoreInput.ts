export interface BookStoreInput {
    readonly id: string;
    readonly name: string;
    readonly bookIds: readonly string[];
}