import { SchemaTypes } from "../meta/SchemaTypes";

export interface StateManager<TSchema extends SchemaTypes> {

    saveObject<TTypeName extends keyof TSchema>(typeName: TTypeName, obj: RecursivePartial<TSchema[TTypeName]>): void;

    deleteObject<TTypeName extends keyof TSchema>(typeName: TTypeName, id: any): boolean;

    readonly undoManager: UndoManager;

    transaction<TResult>(callback: (ts: TransactionStatus) => TResult): TResult;
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
