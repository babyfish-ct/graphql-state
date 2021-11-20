import { ObjectFetcher } from "graphql-ts-client-api";
import { EntityChangeEvent } from "../..";
import { EntityEvictEvent } from "../../entities/EntityEvent";
import { EntityManager } from "../../entities/EntityManager";
import { QueryResult } from "../../entities/QueryResult";
import { toRuntimeShape } from "../../entities/RuntimeShape";
import { Network } from "../../meta/Network";
import { SchemaMetadata } from "../../meta/impl/SchemaMetadata";
import { SchemaType } from "../../meta/SchemaType";
import { StateManager, TransactionStatus } from "../StateManager";
import { ReleasePolicy } from "../Types";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValue } from "./StateValue";
import { UndoManagerImpl } from "./UndoManagerImpl";

export class StateManagerImpl<TSchema extends SchemaType> implements StateManager<TSchema> {

    releasePolicy: ReleasePolicy<any>;
    
    private _rootScope = new ScopedStateManager(this);

    private _stateValueChangeListeners = new Set<StateValueChangeListener>();

    private _queryResultChangeListeners = new Set<QueryResultChangeListener>();

    private _entityManager: EntityManager;

    constructor(schema?: SchemaMetadata, readonly network?: Network) {
        this._entityManager = new EntityManager(this, schema ?? new SchemaMetadata());
        this.releasePolicy = (aliveTime, variables) => {
            if (aliveTime < 1000) {
                return 0;
            }
            if (variables !== undefined) {
                return Math.min(aliveTime, 30_000);    
            }
            return Math.min(aliveTime, 60_000);
        }
    }

    get entityManager(): EntityManager {
        return this._entityManager;
    }
    
    get undoManager(): UndoManagerImpl {
        throw new Error();
    }

    save<T extends object, TVariables extends object = {}>(
        fetcher: ObjectFetcher<string, T, any>,
        obj: T,
        variables?: TVariables
    ): void {
        if (!this.entityManager.schema.isAcceptable(fetcher.fetchableType)) {
            throw new Error("Cannot accept that fetcher because it is not configured in the state manager");
        }
        this.entityManager.save(toRuntimeShape(fetcher, undefined, variables), obj);
    }

    delete<TName extends keyof TSchema["entities"] & string>(
        typeName: TName, 
        idOrArray: TSchema["entities"][TName][" $id"] | ReadonlyArray<TSchema["entities"][TName][" $id"] | undefined> | undefined
    ) {
        this.entityManager.delete(typeName, idOrArray);
    }

    evict<TName extends keyof TSchema["entities"] & string>(
        typeName: TName, 
        idOrArray?: TSchema["entities"][TName][" $id"] | ReadonlyArray<TSchema["entities"][TName][" $id"] | undefined> | undefined
    ) {
        this.entityManager.evict(typeName, idOrArray);
    }

    addEntityEvictListener(listener: (e: EntityEvictEvent) => void): void {
        this.entityManager.addEvictListener(undefined, listener);
    }

    removeEntityEvictListener(listener: (e: EntityEvictEvent) => void): void {
        this.entityManager.removeEvictListener(undefined, listener);
    }

    addEntityEvictListeners(
        listeners: { 
            readonly [TName in keyof TSchema["entities"] & string]?: (e: TSchema["entities"][TName][" $evictEvent"]) => void 
        }
    ): void {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.entityManager.addEvictListener(typeName, listener);
            }
        }
    }

    removeEntityEvictListeners(
        listeners: { 
            readonly [TName in keyof TSchema["entities"] & string]?: (e: TSchema["entities"][TName][" $evictEvent"]) => void 
        }
    ): void {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.entityManager.removeEvictListener(typeName, listener);
            }
        }
    }

    addEntityChangeListener(listener: (e: EntityChangeEvent) => void): void {
        this.entityManager.addChangeListener(undefined, listener);
    }

    removeEntityChangeListener(listener: (e: EntityChangeEvent) => void): void {
        this.entityManager.removeChangeListener(undefined, listener);
    }

    addEntityChangeListeners(
        listeners: { 
            readonly [TName in keyof TSchema["entities"] & string]?: (e: TSchema["entities"][TName][" $changeEvent"]) => void 
        }
    ): void {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.entityManager.addChangeListener(typeName, listener);
            }
        }
    }

    removeEntityChangeListeners(
        listeners: { 
            readonly [TName in keyof TSchema["entities"] & string]?: (e: TSchema["entities"][TName][" $changeEvent"]) => void 
        }
    ): void {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.entityManager.removeChangeListener(typeName, listener);
            }
        }
    }

    scope(path: string): ScopedStateManager {
        return this._rootScope.subScope(path);
    }

    transaction<TResult>(callback: (ts: TransactionStatus) => TResult): TResult {
        throw new Error();
    }

    addStateValueChangeListener(listener: StateValueChangeListener) {
        if (this._stateValueChangeListeners.has(listener)) {
            throw new Error(`Cannot add existing listener`);
        }
        if (listener !== undefined && listener !== null) {
            this._stateValueChangeListeners.add(listener);
        }
    }

    removeStateValueChangeListener(listener: StateValueChangeListener) {
        this._stateValueChangeListeners.delete(listener);
    }

    publishStateValueChangeEvent(e: StateValueChangeEvent) {
        for (const listener of this._stateValueChangeListeners) {
            listener(e);
        }
    }

    addQueryResultChangeListener(listener: QueryResultChangeListener) {
        if (this._queryResultChangeListeners.has(listener)) {
            throw new Error(`Cannot add existing listener`);
        }
        if (listener !== undefined && listener !== null) {
            this._queryResultChangeListeners.add(listener);
        }
    }

    removeQueryResultChangeListener(listener: QueryResultChangeListener) {
        this._queryResultChangeListeners.delete(listener);
    }

    publishQueryResultChangeEvent(e: QueryResultChangeEvent) {
        for (const listener of this._queryResultChangeListeners) {
            listener(e);
        }
    }

    suspendBidirectionalAssociationManagement<T>(action: () => T): T {
        return this.entityManager.suspendBidirectionalAssociationManagement(action);
    }

    dispose() {
        this._stateValueChangeListeners.clear();
        this._queryResultChangeListeners.clear();
        this._entityManager = new EntityManager(this, this._entityManager.schema);
        this._rootScope.dispose();
    }
}


export type StateValueChangeListener = (e: StateValueChangeEvent) => void;

export interface StateValueChangeEvent {
    readonly stateValue: StateValue;
    readonly changedType: "RESULT_CHANGE" | "ASYNC_STATE_CHANGE";
}

export type QueryResultChangeListener = (e: QueryResultChangeEvent) => void;

export interface QueryResultChangeEvent {
    readonly queryResult: QueryResult;
    readonly changedType: "RESULT_CHANGE" | "ASYNC_STATE_CHANGE";
}