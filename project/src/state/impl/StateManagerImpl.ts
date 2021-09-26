import { SchemaTypes } from "../../meta/SchemaTypes";
import { StateManager, TransactionStatus } from "../StateManager";
import { ScopedStateManager } from "./ScopedStateManager";
import { StateValue } from "./StateValue";
import { UndoManagerImpl } from "./UndoManagerImpl";

export class StateManagerImpl<TSchema extends SchemaTypes> implements StateManager<TSchema> {

    private _scopedStateManager?: ScopedStateManager;

    private _listeners: StateValueChangeListener[] = [];

    get undoManager(): UndoManagerImpl {
        throw new Error();
    }

    registerScope(): ScopedStateManager {
        return this._scopedStateManager = new ScopedStateManager(this._scopedStateManager ?? this);
    }

    unregisterScope(scopedStateManager: ScopedStateManager) {
        
        /*
         * The argument "scopedStateManager" may not be this._scopedStateManager
         * because unmounting logic of useEffect is executed by wrong order: Parent first, child later. 
         */
        for (let scope = this._scopedStateManager; scope !== undefined; scope = scope.parent) {
            if (scope === scopedStateManager) {
                this._scopedStateManager = scope.parent;
                return;
            }
        }
        console.warn('Failed to unregster because the argument "scopedStateManager" is not an existing scope');
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

    addStateChangeListener(listener: StateValueChangeListener) {
        this._listeners.push(listener);
    }

    removeStateChangeListener(listener: StateValueChangeListener) {
        const index = this._listeners.indexOf(listener);
        if (index !== -1) {
            this._listeners.splice(index, 1);
        }
    }

    publishStateChangeEvent(e: StateValueChangeEvent) {
        for (const listener of this._listeners) {
            listener(e);
        }
    }
}


export type StateValueChangeListener = (e: StateValueChangeEvent) => void;

export interface StateValueChangeEvent {
    stateValue: StateValue;
}