export declare class SpaceSavingMap<K, V> {
    private value?;
    private valueMap?;
    get(key: K): V | undefined;
    put(key: K, value: V): V | undefined;
    computeIfAbsent(key: K, valueSupplier: (key: K) => V): V;
    remove(key: K): V | undefined;
    forEachValue(callback: (value: V) => boolean | undefined): void;
}
