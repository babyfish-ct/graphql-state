import { ObjectFetcher } from "graphql-ts-client-api";
import { EntityChangeEvent } from "../..";
import { EntityManager } from "../../entities/EntityManager";
import { QueryResult } from "../../entities/QueryResult";
import { toRuntimeShape } from "../../entities/RuntimeShape";
import { Network } from "../../meta/Configuration";
import { SchemaMetadata } from "../../meta/impl/SchemaMetadata";
import { SchemaType } from "../../meta/SchemaType";
import { StateManager, TransactionStatus } from "../StateManager";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValue } from "./StateValue";
import { UndoManagerImpl } from "./UndoManagerImpl";

export class StateManagerImpl<TSchema extends SchemaType> implements StateManager<TSchema> {

    private _scopedStateManager?: ScopedStateManager;

    private _stateValueChangeListeners = new Set<StateValueChangeListener>();

    private _queryResultChangeListeners = new Set<QueryResultChangeListener>();

    readonly entityManager: EntityManager;

    constructor(schema?: SchemaMetadata, readonly network?: Network) {
        this.entityManager = new EntityManager(this, schema ?? new SchemaMetadata());
    }
    
    get undoManager(): UndoManagerImpl {
        throw new Error();
    }

    save<T extends object, TVariables extends object = {}>(
        fetcher: ObjectFetcher<string, T, any>,
        obj: T,
        variables?: TVariables
    ): void {
        this.entityManager.save(toRuntimeShape(fetcher, variables), obj);
    }

    delete<TName extends keyof TSchema & string>(
        typeName: TName, 
        idOrArray: TSchema[TName][" $id"] | ReadonlyArray<TSchema[TName][" $id"]>
    ) {
        this.entityManager.delete(typeName, idOrArray);
    }

    addListener(listener: (e: EntityChangeEvent) => void): void {
        this.entityManager.addListener(undefined, listener);
    }

    removeListener(listener: (e: EntityChangeEvent) => void): void {
        this.entityManager.removeListener(undefined, listener);
    }

    addListeners(
        listeners: { 
            readonly [TName in keyof TSchema & string]?: (e: TSchema[TName][" $event"]) => void 
        }
    ): void {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.entityManager.addListener(typeName, listener);
            }
        }
    }

    removeListeners(
        listeners: { 
            readonly [TName in keyof TSchema & string]?: (e: TSchema[TName][" $event"]) => void 
        }
    ): void {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.entityManager.removeListener(typeName, listener);
            }
        }
    }

    registerScope(): ScopedStateManager {
        return this._scopedStateManager = new ScopedStateManager(this._scopedStateManager ?? this);
    }

    unregisterScope(scopedStateManager: ScopedStateManager) {
        
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

    get scope(): ScopedStateManager {
        const result = this._scopedStateManager;
        if (result === undefined) {
            throw new Error("No scope");
        }
        return result;
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