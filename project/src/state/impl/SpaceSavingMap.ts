
export class SpaceSavingMap<K, V> {

    private value?: V;

    private valueMap?: Map<K, V>;

    get isEmpty(): boolean {
        return this.value === undefined && this.valueMap === undefined;
    }

    get(key: K): V | undefined {
        return key === undefined ? this.value : this.valueMap?.get(key);
    }

    put(key: K, value: V): V | undefined {
        if (key === undefined) {
            const oldValue = this.value;
            this.value = value;
            return oldValue;
        } else {
            let map = this.valueMap;
            const oldValue = map?.get(key);
            if (value !== undefined) {
                if (map === undefined) {
                    this.valueMap = map = new Map<K, V>();
                }
                map.set(key, value);
            } else if (map !== undefined) {
                map.delete(key);
                if (map.size === 0) {
                    this.valueMap = undefined;
                }
            }
            return oldValue;
        }
    }

    computeIfAbsent(key: K, valueSupplier: (key: K) => V): V {
        let oldValue: V | undefined;
        if (key === undefined) {
            oldValue = this.value;
            if (oldValue === undefined) {
                return this.value = valueSupplier(key);
            }
        } else {
            let map = this.valueMap;
            oldValue = map?.get(key);
            if (oldValue === undefined) {
                const newValue = valueSupplier(key);
                if (newValue !== undefined) {
                    if (map === undefined) {
                        this.valueMap = map = new Map<K, V>();
                    }
                    map.set(key, newValue);
                }
                return newValue;
            }
        }
        return oldValue;
    }

    remove(key: K): V | undefined {
        if (key === undefined) {
            const oldValue = this.value;
            this.value = undefined;
            return oldValue;
        } else if (this.valueMap !== undefined) {
            const oldValue = this.valueMap.get(key);
            this.valueMap.delete(key);
            if (this.valueMap.size === 0) {
                this.valueMap = undefined;
            }
            return oldValue;
        }
    }

    clear() {
        this.value = undefined;
        this.valueMap = undefined;
    }

    forEach(callback: (key: K, value: V) => boolean | void) {
        if (this.value !== undefined && callback(undefined as any, this.value) === false) {
            return;
        }
        if (this.valueMap !== undefined) {
            for (const [key, value] of this.valueMap) {
                if (callback(key, value) === false) {
                    return;
                }
            }
        }
    }

    forEachValue(callback: (value: V) => boolean | void) {
        if (this.value !== undefined && callback(this.value) === false) {
            return;
        }
        if (this.valueMap !== undefined) {
            for (const [key, value] of this.valueMap) {
                if (callback(value) === false) {
                    return;
                }
            }
        }
    }

    cloneValues(): V[] {
        const arr: V[] = [];
        if (this.value !== undefined) {
            arr.push(this.value);
        }
        if (this.valueMap !== undefined) {
            for (const value of this.valueMap.values()) {
                arr.push(value);
            }
        }
        return arr;
    }
}
