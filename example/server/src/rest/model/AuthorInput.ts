export interface AuthorInput {
    readonly id: string;
    readonly name: string;
    readonly bookIds: readonly string[];
}