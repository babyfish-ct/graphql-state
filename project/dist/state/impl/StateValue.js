"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateValue = void 0;
class StateValue {
    constructor(stateInstance, args, disposer) {
        this.stateInstance = stateInstance;
        this.args = args;
        this.disposer = disposer;
        this._refCount = 0;
        this._mounted = false;
        this._createdMillis = new Date().getTime();
        if (!stateInstance.state[" $parameterized"] && args !== undefined) {
            throw new Error("Cannot create state value with varibles for single state without parameters");
        }
    }
    retain() {
        if (this._refCount++ === 0) {
            this.mount();
        }
        return this;
    }
    release(releasePolicy) {
        var _a;
        if (--this._refCount === 0) {
            const millis = (releasePolicy !== null && releasePolicy !== void 0 ? releasePolicy : this.stateInstance.scopedStateManager.stateManager.releasePolicy)(new Date().getTime() - this._createdMillis, (_a = this.args) === null || _a === void 0 ? void 0 : _a.filterArgs);
            if (millis <= 0) {
                this.dispose(true);
                return;
            }
            if (this._disposeTimerId !== undefined) {
                clearTimeout(this._disposeTimerId);
            }
            this._disposeTimerId = setTimeout(() => {
                if (this._refCount === 0) {
                    this.dispose(true);
                }
            }, millis);
        }
    }
    dispose(executeExternalDisposer) {
        if (this._disposeTimerId !== undefined) {
            clearTimeout(this._disposeTimerId);
            this._disposeTimerId = undefined;
        }
        try {
            if (executeExternalDisposer) {
                this.disposer();
            }
        }
        finally {
            this.umount();
        }
    }
    mount() {
        var _a, _b;
        if (!this._mounted) {
            this._mounted = true;
            const state = this.stateInstance.state;
            const mount = state[" $stateType"] === "WRITABLE" ?
                (_a = state[" $options"]) === null || _a === void 0 ? void 0 : _a.mount :
                (_b = state[" $options"]) === null || _b === void 0 ? void 0 : _b.mount;
            if (mount !== undefined) {
                const ctx = this.createMountContext();
                this._unmountHandler = mount(ctx);
            }
            this.onMount();
        }
    }
    umount() {
        if (this._mounted) {
            this._mounted = false;
            try {
                this.onUnmount();
            }
            finally {
                const h = this._unmountHandler;
                if (h !== undefined) {
                    this._unmountHandler = undefined;
                    h();
                }
            }
        }
    }
    onMount() { }
    onUnmount() { }
}
exports.StateValue = StateValue;
