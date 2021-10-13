import { ObjectFetcher } from "graphql-ts-client-api";
import { EntityChangeEvent } from "../..";
import { EntityManager } from "../../entities/EntityManager";
import { QueryResult } from "../../entities/QueryResult";
import { SchemaMetadata } from "../../meta/impl/SchemaMetadata";
import { SchemaType } from "../../meta/SchemaType";
import { StateManager, TransactionStatus } from "../StateManager";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValue } from "./StateValue";
import { UndoManagerImpl } from "./UndoManagerImpl";
export declare class StateManagerImpl<TSchema extends SchemaType> implements StateManager<TSchema> {
    private _scopedStateManager?;
    private _stateValueChangeListeners;
    private _queryResultChangeListeners;
    readonly entityManager: EntityManager;
    constructor(schema?: SchemaMetadata);
    get undoManager(): UndoManagerImpl;
    save<T extends object, TVariables extends object = {}>(fetcher: ObjectFetcher<string, T, any>, obj: T, variables?: TVariables): void;
    delete<TName extends keyof TSchema & string>(typeName: TName, idOrArray: TSchema[TName][" $id"] | ReadonlyArray<TSchema[TName][" $id"]>): void;
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
    addStateValueChangeListener(listener: StateValueChangeListener): void;
    removeStateValueChangeListener(listener: StateValueChangeListener): void;
    publishStateValueChangeEvent(e: StateValueChangeEvent): void;
    addQueryResultChangeListener(listener: QueryResultChangeListener): void;
    removeQueryResultChangeListener(listener: QueryResultChangeListener): void;
    publishQueryResultChangeEvent(e: QueryResultChangeEvent): void;
}
export declare type StateValueChangeListener = (e: StateValueChangeEvent) => void;
export interface StateValueChangeEvent {
    readonly stateValue: StateValue;
    readonly changedType: "RESULT_CHANGE" | "ASYNC_STATE_CHANGE";
}
export declare type QueryResultChangeListener = (e: QueryResultChangeEvent) => void;
export interface QueryResultChangeEvent {
    readonly queryResult: QueryResult;
    readonly changedType: "RESULT_CHANGE" | "ASYNC_STATE_CHANGE";
}
