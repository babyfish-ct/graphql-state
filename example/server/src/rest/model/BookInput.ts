export interface BookInput {
    readonly id: string;
    readonly name: string;
    readonly storeId?: string;
    readonly authorIds: readonly string[];
}