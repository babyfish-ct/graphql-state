"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManagerImpl = void 0;
const EntityManager_1 = require("../../entities/EntityManager");
const RuntimeShape_1 = require("../../entities/RuntimeShape");
const SchemaMetadata_1 = require("../../meta/impl/SchemaMetadata");
const ScopedStateManager_1 = require("./ScopedStateManager");
class StateManagerImpl {
    constructor(schema, network) {
        this.network = network;
        this._stateValueChangeListeners = new Set();
        this._queryResultChangeListeners = new Set();
        this.entityManager = new EntityManager_1.EntityManager(this, schema !== null && schema !== void 0 ? schema : new SchemaMetadata_1.SchemaMetadata());
    }
    get undoManager() {
        throw new Error();
    }
    save(fetcher, obj, variables) {
        if (!this.entityManager.schema.isAcceptable(fetcher.fetchableType)) {
            throw new Error("Deos not accept that fetcher because it is not configured in the state manager");
        }
        this.entityManager.save(RuntimeShape_1.toRuntimeShape(fetcher, variables), obj);
    }
    delete(typeName, idOrArray) {
        this.entityManager.delete(typeName, idOrArray);
    }
    addListener(listener) {
        this.entityManager.addListener(undefined, listener);
    }
    removeListener(listener) {
        this.entityManager.removeListener(undefined, listener);
    }
    addListeners(listeners) {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.entityManager.addListener(typeName, listener);
            }
        }
    }
    removeListeners(listeners) {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.entityManager.removeListener(typeName, listener);
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
    addStateValueChangeListener(listener) {
        if (this._stateValueChangeListeners.has(listener)) {
            throw new Error(`Cannot add existing listener`);
        }
        if (listener !== undefined && listener !== null) {
            this._stateValueChangeListeners.add(listener);
        }
    }
    removeStateValueChangeListener(listener) {
        this._stateValueChangeListeners.delete(listener);
    }
    publishStateValueChangeEvent(e) {
        for (const listener of this._stateValueChangeListeners) {
            listener(e);
        }
    }
    addQueryResultChangeListener(listener) {
        if (this._queryResultChangeListeners.has(listener)) {
            throw new Error(`Cannot add existing listener`);
        }
        if (listener !== undefined && listener !== null) {
            this._queryResultChangeListeners.add(listener);
        }
    }
    removeQueryResultChangeListener(listener) {
        this._queryResultChangeListeners.delete(listener);
    }
    publishQueryResultChangeEvent(e) {
        for (const listener of this._queryResultChangeListeners) {
            listener(e);
        }
    }
}
exports.StateManagerImpl = StateManagerImpl;
