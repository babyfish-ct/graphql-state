import { EntityManager } from "../../entities/EntityManager";
import { SchemaMetadata } from "../../meta/impl/SchemaMetadata";
import { SchemaTypes } from "../../meta/SchemaTypes";
import { EntityChangedEvent } from "../ChangedEntity";
import { StateManager, TransactionStatus } from "../StateManager";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValue } from "./StateValue";
import { UndoManagerImpl } from "./UndoManagerImpl";
export declare class StateManagerImpl<TSchema extends SchemaTypes> implements StateManager<TSchema> {
    private _scopedStateManager?;
    private _stateChangeListeners;
    private _entityChagneListenerMap;
    readonly entityManager: EntityManager;
    constructor(schema?: SchemaMetadata);
    get undoManager(): UndoManagerImpl;
    save<TTypeName extends keyof TSchema>(typeName: TTypeName, obj: Partial<TSchema[TTypeName]>): void;
    delete<TTypeName extends keyof TSchema>(typeName: TTypeName, id: any): boolean;
    addListener(listener: (e: EntityChangedEvent<{}>) => void): void;
    removeListener(listener: (e: EntityChangedEvent<{}>) => void): void;
    addListeners(listeners: {
        readonly [TEntity in keyof TSchema]?: (e: EntityChangedEvent<TSchema[TEntity]>) => void;
    }): void;
    removeListeners(listeners: {
        readonly [TEntity in keyof TSchema]?: (e: EntityChangedEvent<TSchema[TEntity]>) => void;
    }): void;
    registerScope(): ScopedStateManager;
    unregisterScope(scopedStateManager: ScopedStateManager): void;
    get scope(): ScopedStateManager;
    transaction<TResult>(callback: (ts: TransactionStatus) => TResult): TResult;
    addStateChangeListener(listener: StateValueChangeListener): void;
    removeStateChangeListener(listener: StateValueChangeListener): void;
    publishStateChangeEvent(e: StateValueChangeEvent): void;
    private addEntityStateListener;
    private removeEntityStateListener;
    private publishEntityChangeEvent;
}
export declare type StateValueChangeListener = (e: StateValueChangeEvent) => void;
export interface StateValueChangeEvent {
    stateValue: StateValue;
    changedType: "RESULT_CHANGE" | "ASYNC_STATE_CHANGE";
}
