export interface EntityChangeEvent {
    readonly typeName: string;
    readonly id: any;
    readonly changedType: "INSERT" | "UPDATE" | "DELETE";
    readonly changedKeys: ReadonlyArray<EntityChangedKey>;
    oldValue(changedKey: EntityChangedKey): any;
    newValue(changedKey: EntityChangedKey): any;
}

export type EntityChangedKey = string | {
    readonly name: string,
    readonly variables: any
};