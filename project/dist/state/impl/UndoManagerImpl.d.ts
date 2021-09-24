import { UndoManager } from "../StateManager";
export declare class UndoManagerImpl implements UndoManager {
    constructor(capacity: number);
    get isUndoable(): boolean;
    get isRedoable(): boolean;
    undo(): void;
    redo(): void;
    clear(): void;
}
