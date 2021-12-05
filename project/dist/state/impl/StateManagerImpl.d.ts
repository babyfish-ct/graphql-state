import { ObjectFetcher } from "graphql-ts-client-api";
import { EntityChangeEvent } from "../..";
import { EntityEvictEvent } from "../../entities/EntityEvent";
import { EntityManager } from "../../entities/EntityManager";
import { QueryResult } from "../../entities/QueryResult";
import { Network } from "../../meta/Network";
import { SchemaMetadata } from "../../meta/impl/SchemaMetadata";
import { SchemaType } from "../../meta/SchemaType";
import { StateManager } from "../StateManager";
import { ReleasePolicy } from "../Types";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValue } from "./StateValue";
import { GraphSnapshot, SimpleStateScope } from "../Monitor";
export declare class StateManagerImpl<TSchema extends SchemaType> implements StateManager<TSchema> {
    readonly network?: Network | undefined;
    readonly id: string;
    releasePolicy: ReleasePolicy<any>;
    private _rootScope;
    private _stateValueChangeListeners;
    private _queryResultChangeListeners;
    private _entityManager;
    constructor(schema?: SchemaMetadata, network?: Network | undefined);
    get entityManager(): EntityManager;
    save<T extends object, TVariables extends object = {}>(fetcher: ObjectFetcher<string, T, any>, obj: T, variables?: TVariables): void;
    delete<TName extends keyof TSchema["entities"] & string>(typeName: TName, idOrArray: TSchema["entities"][TName][" $id"] | ReadonlyArray<TSchema["entities"][TName][" $id"] | undefined> | undefined): void;
    evict<TName extends keyof TSchema["entities"] & string>(typeName: TName, idOrArray?: TSchema["entities"][TName][" $id"] | ReadonlyArray<TSchema["entities"][TName][" $id"] | undefined> | undefined): void;
    addEntityEvictListener(listener: (e: EntityEvictEvent) => void): void;
    removeEntityEvictListener(listener: (e: EntityEvictEvent) => void): void;
    addEntityEvictListeners(listeners: {
        readonly [TName in keyof TSchema["entities"] & string]?: (e: TSchema["entities"][TName][" $evictEvent"]) => void;
    }): void;
    removeEntityEvictListeners(listeners: {
        readonly [TName in keyof TSchema["entities"] & string]?: (e: TSchema["entities"][TName][" $evictEvent"]) => void;
    }): void;
    addEntityChangeListener(listener: (e: EntityChangeEvent) => void): void;
    removeEntityChangeListener(listener: (e: EntityChangeEvent) => void): void;
    addEntityChangeListeners(listeners: {
        readonly [TName in keyof TSchema["entities"] & string]?: (e: TSchema["entities"][TName][" $changeEvent"]) => void;
    }): void;
    removeEntityChangeListeners(listeners: {
        readonly [TName in keyof TSchema["entities"] & string]?: (e: TSchema["entities"][TName][" $changeEvent"]) => void;
    }): void;
    scope(path: string): ScopedStateManager;
    addStateValueChangeListener(listener: StateValueChangeListener): void;
    removeStateValueChangeListener(listener: StateValueChangeListener): void;
    publishStateValueChangeEvent(e: StateValueChangeEvent): void;
    addQueryResultChangeListener(listener: QueryResultChangeListener): void;
    removeQueryResultChangeListener(listener: QueryResultChangeListener): void;
    publishQueryResultChangeEvent(e: QueryResultChangeEvent): void;
    suspendBidirectionalAssociationManagement<T>(action: () => T): T;
    dispose(): void;
    simpleStateMonitor(): SimpleStateScope;
    graphStateMonitor(): GraphSnapshot;
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
