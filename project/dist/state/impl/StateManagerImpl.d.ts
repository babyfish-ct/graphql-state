import { SchemaTypes } from "../../meta/SchemaTypes";
import { StateManager, TransactionStatus } from "../StateManager";
import { ScopedStateManager } from "./ScopedStateManager";
import { UndoManagerImpl } from "./UndoManagerImpl";
export declare class StateManagerImpl<TSchema extends SchemaTypes> implements StateManager<TSchema> {
    private _scopedStateManager?;
    get undoManager(): UndoManagerImpl;
    createScope(): ScopedStateManager;
    usingScope<TResult>(scopedStateManager: ScopedStateManager, callback: () => TResult): TResult;
    get scope(): ScopedStateManager;
    transaction<TResult>(callback: (ts: TransactionStatus) => TResult): TResult;
}
