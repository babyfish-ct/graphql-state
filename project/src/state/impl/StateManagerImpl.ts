import { SchemaTypes } from "../../meta/SchemaTypes";
import { StateManager, TransactionStatus } from "../StateManager";
import { ScopedStateManager } from "./ScopedStateManager";
import { UndoManagerImpl } from "./UndoManagerImpl";

export class StateManagerImpl<TSchema extends SchemaTypes> implements StateManager<TSchema> {

    private _scopedStateManager?: ScopedStateManager;

    get undoManager(): UndoManagerImpl {
        throw new Error();
    }

    createScope(): ScopedStateManager {
        return new ScopedStateManager(this._scopedStateManager ?? this);
    }

    usingScope<TResult>(scopedStateManager: ScopedStateManager, callback: () => TResult): TResult {
        if (scopedStateManager.parent !== this._scopedStateManager) {
            throw new Error("Cannot reuse the scope whose parent is not current scope");
        }
        this._scopedStateManager = scopedStateManager;
        try {
            return callback();
        } finally {
            this._scopedStateManager = scopedStateManager.parent;
        }
    }

    get scope(): ScopedStateManager {
        const result = this._scopedStateManager;
        if (result === undefined) {
            throw new Error("No scope");
        }
        return result;
    }

    transaction<TResult>(callback: (ts: TransactionStatus) => TResult): TResult {
        throw new Error();
    }
}