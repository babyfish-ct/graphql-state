import { Fetcher } from "graphql-ts-client-api";
import { EntityChangeEvent } from "../..";
import { EntityManager } from "../../entities/EntityManager";
import { ModificationContext } from "../../entities/ModificationContext";
import { SchemaMetadata } from "../../meta/impl/SchemaMetadata";
import { SchemaType } from "../../meta/SchemaType";
import { StateManager, TransactionStatus } from "../StateManager";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValue } from "./StateValue";
import { UndoManagerImpl } from "./UndoManagerImpl";

export class StateManagerImpl<TSchema extends SchemaType> implements StateManager<TSchema> {

    private _scopedStateManager?: ScopedStateManager;

    private _stateChangeListeners = new Set<StateValueChangeListener>();

    private _entityChagneListenerMap = new Map<string | undefined, Set<(e: EntityChangeEvent) => any>>();

    readonly entityManager: EntityManager;

    constructor(schema?: SchemaMetadata) {
        this.entityManager = new EntityManager(schema ?? new SchemaMetadata());
    }
    
    get undoManager(): UndoManagerImpl {
        throw new Error();
    }

    save<TName extends keyof TSchema & string, T extends object, TVariables extends object = {}>(
        fetcher: Fetcher<TName, T, any>,
        obj: T,
        variables?: TVariables
    ): void {
        const ctx = new ModificationContext();
        this.entityManager.save(ctx, fetcher, obj);
        ctx.fireEvents(e => {
            this.publishEntityChangeEvent(e);
        });
    }

    delete<TName extends keyof TSchema & string>(
        typeName: TName, 
        id: TSchema[TName][" $id"]
    ): boolean {
        throw new Error("Unsupported operation exception");
    }

    addListener(listener: (e: EntityChangeEvent) => void): void {
        this.addEntityStateListener(undefined, listener);
    }

    removeListener(listener: (e: EntityChangeEvent) => void): void {
        this.removeEntityStateListener(undefined, listener);
    }

    addListeners(
        listeners: { 
            readonly [TName in keyof TSchema & string]?: (e: TSchema[TName][" $event"]) => void 
        }
    ): void {
        for (const typeName in listeners) {
            const listener = listeners[typeName];
            if (listener !== undefined && listener !== null) {
                this.addEntityStateListener(typeName, listener);
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
                this.removeEntityStateListener(typeName, listener);
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

    addStateChangeListener(listener: StateValueChangeListener) {
        if (this._stateChangeListeners.has(listener)) {
            throw new Error(`Cannot add existing listener`);
        }
        if (listener !== undefined && listener !== null) {
            this._stateChangeListeners.add(listener);
        }
    }

    removeStateChangeListener(listener: StateValueChangeListener) {
        this._stateChangeListeners.delete(listener);
    }

    publishStateChangeEvent(e: StateValueChangeEvent) {
        for (const listener of this._stateChangeListeners) {
            listener(e);
        }
    }

    private addEntityStateListener(typeName: string | undefined, listener: (e: EntityChangeEvent) => void): void {
        if (listener !== undefined && listener !== null) {
            let set = this._entityChagneListenerMap.get(typeName);
            if (set === undefined) {
                set = new Set<(e: EntityChangeEvent) => void>();
                this._entityChagneListenerMap.set(typeName, set);
            } 
            if (set.has(listener)) {
                throw new Error(`Cannot add exists listener`);
            }
            set.add(listener);
        }
    }

    private removeEntityStateListener(typeName: string | undefined, listener: (e: EntityChangeEvent) => void): void {
        this._entityChagneListenerMap.get(typeName)?.delete(listener);
    }

    private publishEntityChangeEvent(e: EntityChangeEvent) {
        for (const [, set] of this._entityChagneListenerMap) {
            for (const listener of set) {
                listener(e);
            }
        }
    }
}


export type StateValueChangeListener = (e: StateValueChangeEvent) => void;

export interface StateValueChangeEvent {
    stateValue: StateValue;
    changedType: "RESULT_CHANGE" | "ASYNC_STATE_CHANGE";
}