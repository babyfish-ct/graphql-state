"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManagerImpl = void 0;
const EntityManager_1 = require("../../entities/EntityManager");
const ModificationContext_1 = require("../../entities/ModificationContext");
const SchemaMetadata_1 = require("../../meta/impl/SchemaMetadata");
const ScopedStateManager_1 = require("./ScopedStateManager");
class StateManagerImpl {
    constructor(schema) {
        this._stateChangeListeners = new Set();
        this._entityChagneListenerMap = new Map();
        this.entityManager = new EntityManager_1.EntityManager(schema !== null && schema !== void 0 ? schema : new SchemaMetadata_1.SchemaMetadata());
    }
    get undoManager() {
        throw new Error();
    }
    save(typeName, obj) {
        const ctx = new ModificationContext_1.ModificationContext();
        this.entityManager.save(ctx, typeName, obj);
        ctx.fireEvents(e => {
            this.publishEntityChangeEvent(e);
        });
    }
    delete(typeName, id) {
        return false;
    }
    addListener(listener) {
        this.addEntityStateListener(undefined, listener);
    }
    removeListener(listener) {
        this.removeEntityStateListener(undefined, listener);
    }
    addListeners(listeners) {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.addEntityStateListener(typeName, listener);
            }
        }
    }
    removeListeners(listeners) {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.removeEntityStateListener(typeName, listener);
            }
        }
    }
    registerScope() {
        var _a;
        return this._scopedStateManager = new ScopedStateManager_1.ScopedStateManager((_a = this._scopedStateManager) !== null && _a !== void 0 ? _a : this);
    }
    unregisterScope(scopedStateManager) {
        /*
         * The argument "scopedStateManager" may not be this._scopedStateManager
         * because unmounting logic of useEffect is executed by wrong order: Parent first, child later.
         */
        for (let scope = this._scopedStateManager; scope !== undefined; scope = scope.parent) {
            if (scope === scopedStateManager) {
                this._scopedStateManager = scope.parent;
                return;
            }
        }
        console.warn('Failed to unregster because the argument "scopedStateManager" is not an existing scope');
    }
    get scope() {
        const result = this._scopedStateManager;
        if (result === undefined) {
            throw new Error("No scope");
        }
        return result;
    }
    transaction(callback) {
        throw new Error();
    }
    addStateChangeListener(listener) {
        if (this._stateChangeListeners.has(listener)) {
            throw new Error(`Cannot add existing listener`);
        }
        if (listener !== undefined && listener !== null) {
            this._stateChangeListeners.add(listener);
        }
    }
    removeStateChangeListener(listener) {
        this._stateChangeListeners.delete(listener);
    }
    publishStateChangeEvent(e) {
        for (const listener of this._stateChangeListeners) {
            listener(e);
        }
    }
    addEntityStateListener(typeName, listener) {
        if (listener !== undefined && listener !== null) {
            let set = this._entityChagneListenerMap.get(typeName);
            if (set === undefined) {
                set = new Set();
                this._entityChagneListenerMap.set(typeName, set);
            }
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }
    removeEntityStateListener(typeName, listener) {
        var _a;
        (_a = this._entityChagneListenerMap.get(typeName)) === null || _a === void 0 ? void 0 : _a.delete(listener);
    }
    publishEntityChangeEvent(e) {
        for (const [, set] of this._entityChagneListenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }
}
exports.StateManagerImpl = StateManagerImpl;
