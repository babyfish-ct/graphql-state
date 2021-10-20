export interface EntityChangeEvent {
    readonly typeName: string;
    readonly id: any;
    readonly changedType: "insert" | "update" | "delete";
    readonly changedKeys: ReadonlyArray<EntityKey>;
    oldValue(changedKey: EntityKey): any;
    newValue(changedKey: EntityKey): any;
}

export interface EntityEvictEvent {
    readonly typeName: string;
    readonly id: any;
    readonly evictedType: "row" | "fields";
    readonly evictedKeys: ReadonlyArray<EntityKey>;
    evictedValue(evictedKey: EntityKey): any;
}

export type EntityKey = string | {
    readonly name: string,
    readonly variables: any
};