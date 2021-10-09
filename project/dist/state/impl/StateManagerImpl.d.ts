import { Fetcher } from "graphql-ts-client-api";
import { EntityChangeEvent } from "../..";
import { EntityManager } from "../../entities/EntityManager";
import { SchemaMetadata } from "../../meta/impl/SchemaMetadata";
import { SchemaType } from "../../meta/SchemaType";
import { StateManager, TransactionStatus } from "../StateManager";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValue } from "./StateValue";
import { UndoManagerImpl } from "./UndoManagerImpl";
export declare class StateManagerImpl<TSchema extends SchemaType> implements StateManager<TSchema> {
    private _scopedStateManager?;
    private _stateChangeListeners;
    private _entityChagneListenerMap;
    readonly entityManager: EntityManager;
    constructor(schema?: SchemaMetadata);
    get undoManager(): UndoManagerImpl;
    save<TName extends keyof TSchema & string, T extends object, TVariables extends object = {}>(fetcher: Fetcher<TName, T, any>, obj: T, variables?: TVariables): void;
    delete<TName extends keyof TSchema & string>(typeName: TName, id: TSchema[TName][" $id"]): boolean;
    addListener(listener: (e: EntityChangeEvent) => void): void;
    removeListener(listener: (e: EntityChangeEvent) => void): void;
    addListeners(listeners: {
        readonly [TName in keyof TSchema & string]?: (e: TSchema[TName][" $event"]) => void;
    }): void;
    removeListeners(listeners: {
        readonly [TName in keyof TSchema & string]?: (e: TSchema[TName][" $event"]) => void;
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
