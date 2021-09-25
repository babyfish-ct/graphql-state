"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManagerImpl = void 0;
const ScopedStateManager_1 = require("./ScopedStateManager");
class StateManagerImpl {
    get undoManager() {
        throw new Error();
    }
    createScope() {
        var _a;
        return new ScopedStateManager_1.ScopedStateManager((_a = this._scopedStateManager) !== null && _a !== void 0 ? _a : this);
    }
    usingScope(scopedStateManager, callback) {
        if (scopedStateManager.parent !== this._scopedStateManager) {
            throw new Error("Cannot reuse the scope whose parent is not current scope");
        }
        this._scopedStateManager = scopedStateManager;
        try {
            return callback();
        }
        finally {
            this._scopedStateManager = scopedStateManager.parent;
        }
    }
    get scope() {
        const result = this._scopedStateManager;
        if (result === undefined) {
            throw new Error("No scope");
        }
        return result;
    }
    transaction(callback) {
        throw new Error();
    }
}
exports.StateManagerImpl = StateManagerImpl;
