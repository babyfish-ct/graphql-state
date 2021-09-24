import { SchemaTypes } from "../meta/SchemaTypes";

export interface StateManager<TSchema extends SchemaTypes> {

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
