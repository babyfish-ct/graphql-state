import { SchemaTypes } from "../meta/SchemaTypes";
import { StateManager, TransactionStatus } from "../state/StateManager";
import { UndoManagerImpl } from "./UndoManagerImpl";

export class StateManagerImpl<TSchema extends SchemaTypes> implements StateManager<TSchema> {

    get undoManager(): UndoManagerImpl {
        throw new Error();
    }

    transaction<TResult>(callback: (ts: TransactionStatus) => TResult): TResult {
        throw new Error();
    }

    scope<TResult>(callback: () => TResult): TResult {
        throw new Error();
    }
}