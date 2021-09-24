import { UndoManager } from "../StateManager";

export class UndoManagerImpl implements UndoManager {

    constructor(capacity: number) {

    }

    get isUndoable(): boolean {
        return false;
    }

    get isRedoable(): boolean {
        return false;
    }

    undo(): void {
        
    }
    
    redo(): void {
        
    }

    clear(): void {

    }
}