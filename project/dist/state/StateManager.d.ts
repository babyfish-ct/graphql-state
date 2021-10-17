import { ObjectFetcher } from "graphql-ts-client-api";
import { EntityChangeEvent } from "..";
import { SchemaType } from "../meta/SchemaType";
export interface StateManager<TSchema extends SchemaType> {
    readonly undoManager: UndoManager;
    transaction<TResult>(callback: (ts: TransactionStatus) => TResult): TResult;
    save<TName extends (keyof TSchema["entities"] & string) | "Query" | "Mutation", T extends object, TVariables extends object = {}>(fetcher: ObjectFetcher<TName, T, any>, obj: T, variables?: TVariables): void;
    save<TName extends keyof TSchema["entities"] & string, T extends object, TVariables extends object = {}>(fetcher: ObjectFetcher<TName, T, any>, objs: readonly T[], variables?: TVariables): void;
    delete<TName extends keyof TSchema["entities"] & string>(typeName: TName, id: TSchema["entities"][TName][" $id"]): void;
    delete<TName extends keyof TSchema["entities"] & string>(typeName: TName, ids: ReadonlyArray<TSchema["entities"][TName][" $id"]>): void;
    addListener(listener: (e: EntityChangeEvent) => void): void;
    removeListener(listener: (e: EntityChangeEvent) => void): void;
    addListeners(listeners: {
        readonly [TName in keyof TSchema["entities"] & string]?: (e: TSchema["entities"][TName][" $event"]) => void;
    }): void;
    removeListeners(listeners: {
        readonly [TName in keyof TSchema["entities"] & string]?: (e: TSchema["entities"][TName][" $event"]) => void;
    }): void;
}
export interface UndoManager {
    readonly isUndoable: boolean;
    readonly isRedoable: boolean;
    undo(): void;
    redo(): void;
    clear(): void;
}
export interface TransactionStatus {
    setRollbackOnly(): void;
}
export declare type RecursivePartial<T> = T extends object ? {
    [P in keyof T]?: RecursivePartial<T[P]>;
} : T;
