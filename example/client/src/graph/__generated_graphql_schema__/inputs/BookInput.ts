/*
 * This input type is not interface, because interfaces 
 * do not satisfy the constraint 'SerializableParam' of recoil
 */
export type BookInput = {
    readonly id: string;
    readonly name: string;
    readonly storeId?: string;
    readonly authorIds: readonly string[];
}
