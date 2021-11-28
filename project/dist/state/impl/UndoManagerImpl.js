"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UndoManagerImpl = void 0;
class UndoManagerImpl {
    constructor(capacity) {
    }
    get isUndoable() {
        return false;
    }
    get isRedoable() {
        return false;
    }
    undo() {
    }
    redo() {
    }
    clear() {
    }
}
exports.UndoManagerImpl = UndoManagerImpl;
