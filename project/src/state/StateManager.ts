import { SchemaTypes } from "../meta/SchemaTypes";
import { EntityChangedEvent } from "./ChangedEntity";

export interface StateManager<TSchema extends SchemaTypes> {

    readonly undoManager: UndoManager;

    transaction<TResult>(callback: (ts: TransactionStatus) => TResult): TResult;

    save<TTypeName extends keyof TSchema>(typeName: TTypeName, obj: RecursivePartial<TSchema[TTypeName]>): void;

    delete<TTypeName extends keyof TSchema>(typeName: TTypeName, id: any): boolean;

    addListener(listener: (e: EntityChangedEvent<{}>) => void): void;

    removeListener(listener: (e: EntityChangedEvent<{}>) => void): void;

    addListeners(listeners: { readonly [TEntity in keyof TSchema]: (e: EntityChangedEvent<TSchema[TEntity]>) => void }): void;

    removeListeners(listeners: { readonly [TEntity in keyof TSchema]: (e: EntityChangedEvent<TSchema[TEntity]>) => void }): void;
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

export type RecursivePartial<T> = 
    T extends object ?
    { [P in keyof T]?: RecursivePartial<T[P]>; } :
    T
;
