export declare class SpaceSavingMap<K, V> {
    private value?;
    private valueMap?;
    get isEmpty(): boolean;
    get(key: K): V | undefined;
    put(key: K, value: V): V | undefined;
    computeIfAbsent(key: K, valueSupplier: (key: K) => V): V;
    remove(key: K): V | undefined;
    clear(): void;
    forEach(callback: (key: K, value: V) => boolean | void): void;
    forEachValue(callback: (value: V) => boolean | void): void;
}
