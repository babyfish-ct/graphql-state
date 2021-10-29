export interface EntityEvictEvent {
    readonly eventType: "evict";
    readonly typeName: string;
    readonly id: any;
    readonly causedByGC: boolean;
    readonly evictedType: "row" | "fields";
    readonly evictedKeys: ReadonlyArray<EntityKey>;
    has(evictedKey: EntityKey): boolean;
    evictedValue(evictedKey: EntityKey): any;
}

export interface EntityChangeEvent {
    readonly eventType: "change";
    readonly typeName: string;
    readonly id: any;
    readonly changedType: "insert" | "update" | "delete";
    readonly changedKeys: ReadonlyArray<EntityKey>;
    has(changedKey: EntityKey): boolean;
    oldValue(changedKey: EntityKey): any;
    newValue(changedKey: EntityKey): any;
}

export type EntityKey = string | {
    readonly name: string,
    readonly variables: any
};