"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManagerImpl = void 0;
const EntityManager_1 = require("../../entities/EntityManager");
const RuntimeShape_1 = require("../../entities/RuntimeShape");
const SchemaMetadata_1 = require("../../meta/impl/SchemaMetadata");
const ScopedStateManager_1 = require("./ScopedStateManager");
const Monitor_1 = require("../Monitor");
class StateManagerImpl {
    constructor(schema, network) {
        this.network = network;
        this.id = `${new Date().getTime()}-${++sequenceNumber}`;
        this._rootScope = new ScopedStateManager_1.ScopedStateManager(this);
        this._stateValueChangeListeners = new Set();
        this._queryResultChangeListeners = new Set();
        this._entityManager = new EntityManager_1.EntityManager(this, schema !== null && schema !== void 0 ? schema : new SchemaMetadata_1.SchemaMetadata());
        this.releasePolicy = (aliveTime, variables) => {
            if (aliveTime < 1000) {
                return 0;
            }
            if (variables !== undefined) {
                return Math.min(aliveTime, 30000);
            }
            return Math.min(aliveTime, 60000);
        };
    }
    get entityManager() {
        return this._entityManager;
    }
    save(fetcher, obj, variables) {
        if (!this.entityManager.schema.isAcceptable(fetcher.fetchableType)) {
            throw new Error("Cannot accept that fetcher because it is not configured in the state manager");
        }
        this.entityManager.save((0, RuntimeShape_1.toRuntimeShape)(fetcher, undefined, variables), obj);
    }
    delete(typeName, idOrArray) {
        this.entityManager.delete(typeName, idOrArray);
    }
    evict(typeName, idOrArray, fieldOrArray) {
        this.entityManager.evict(typeName, idOrArray, fieldOrArray);
    }
    addEntityEvictListener(listener) {
        this.entityManager.addEvictListener(undefined, listener);
    }
    removeEntityEvictListener(listener) {
        this.entityManager.removeEvictListener(undefined, listener);
    }
    addEntityEvictListeners(listeners) {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.entityManager.addEvictListener(typeName, listener);
            }
        }
    }
    removeEntityEvictListeners(listeners) {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.entityManager.removeEvictListener(typeName, listener);
            }
        }
    }
    addEntityChangeListener(listener) {
        this.entityManager.addChangeListener(undefined, listener);
    }
    removeEntityChangeListener(listener) {
        this.entityManager.removeChangeListener(undefined, listener);
    }
    addEntityChangeListeners(listeners) {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.entityManager.addChangeListener(typeName, listener);
            }
        }
    }
    removeEntityChangeListeners(listeners) {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.entityManager.removeChangeListener(typeName, listener);
            }
        }
    }
    scope(path) {
        return this._rootScope.subScope(path);
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
        (0, Monitor_1.postSimpleStateMessage)(e.stateValue, "update", e.stateValue.rawData);
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
    suspendBidirectionalAssociationManagement(action) {
        return this.entityManager.suspendBidirectionalAssociationManagement(action);
    }
    dispose() {
        this._stateValueChangeListeners.clear();
        this._queryResultChangeListeners.clear();
        this._entityManager = new EntityManager_1.EntityManager(this, this._entityManager.schema);
        this._rootScope.dispose();
    }
    simpleStateMonitor() {
        return this._rootScope.monitor();
    }
    graphStateMonitor() {
        return this.entityManager.monitor();
    }
}
exports.StateManagerImpl = StateManagerImpl;
let sequenceNumber = 0;
