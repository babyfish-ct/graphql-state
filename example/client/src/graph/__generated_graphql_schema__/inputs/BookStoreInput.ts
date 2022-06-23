/*
 * This input type is not interface, because interfaces 
 * do not satisfy the constraint 'SerializableParam' of recoil
 */
export type BookStoreInput = {
    readonly id: string;
    readonly name: string;
    readonly bookIds: ReadonlyArray<string>;
}
