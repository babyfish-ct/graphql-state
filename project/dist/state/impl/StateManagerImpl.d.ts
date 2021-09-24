import { SchemaTypes } from "../../meta/SchemaTypes";
import { StateManager, TransactionStatus } from "../StateManager";
import { UndoManagerImpl } from "./UndoManagerImpl";
export declare class StateManagerImpl<TSchema extends SchemaTypes> implements StateManager<TSchema> {
    get undoManager(): UndoManagerImpl;
    transaction<TResult>(callback: (ts: TransactionStatus) => TResult): TResult;
    scope<TResult>(callback: () => TResult): TResult;
}
