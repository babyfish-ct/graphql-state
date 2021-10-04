export interface EntityChangeEvent {
    readonly typeName: string;
    readonly id: any;
    readonly changedType: "INSERT" | "UPDATE" | "DELETE";
    readonly changedKeys: ReadonlyArray<
        string | {
            readonly name: string,
            readonly variables: any
        }
    >;
    oldValue(key: string, variables?: any): any;
    newValue(key: string, variables?: any): any;
}