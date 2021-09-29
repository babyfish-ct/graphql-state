"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpaceSavingMap = void 0;
class SpaceSavingMap {
    get isEmpty() {
        return this.value === undefined && this.valueMap === undefined;
    }
    get(key) {
        var _a;
        return key === undefined ? this.value : (_a = this.valueMap) === null || _a === void 0 ? void 0 : _a.get(key);
    }
    put(key, value) {
        if (key === undefined) {
            const oldValue = this.value;
            this.value = value;
            return oldValue;
        }
        else {
            let map = this.valueMap;
            const oldValue = map === null || map === void 0 ? void 0 : map.get(key);
            if (value !== undefined) {
                if (map === undefined) {
                    this.valueMap = map = new Map();
                }
                map.set(key, value);
            }
            else if (map !== undefined) {
                map.delete(key);
                if (map.size === 0) {
                    this.valueMap = undefined;
                }
            }
            return oldValue;
        }
    }
    computeIfAbsent(key, valueSupplier) {
        let oldValue;
        if (key === undefined) {
            oldValue = this.value;
            if (oldValue === undefined) {
                return this.value = valueSupplier(key);
            }
        }
        else {
            let map = this.valueMap;
            oldValue = map === null || map === void 0 ? void 0 : map.get(key);
            if (oldValue === undefined) {
                const newValue = valueSupplier(key);
                if (newValue !== undefined) {
                    if (map === undefined) {
                        this.valueMap = map = new Map();
                    }
                    map.set(key, newValue);
                }
                return newValue;
            }
        }
        return oldValue;
    }
    remove(key) {
        if (key === undefined) {
            const oldValue = this.value;
            this.value = undefined;
            return oldValue;
        }
        else if (this.valueMap !== undefined) {
            const oldValue = this.valueMap.get(key);
            this.valueMap.delete(key);
            if (this.valueMap.size === 0) {
                this.valueMap = undefined;
            }
            return oldValue;
        }
    }
    forEach(callback) {
        if (this.value !== undefined && callback(undefined, this.value) === false) {
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
    forEachValue(callback) {
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
}
exports.SpaceSavingMap = SpaceSavingMap;
