"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeStateFactory = void 0;
function makeStateFactory() {
    return new StateFactoryImpl();
}
exports.makeStateFactory = makeStateFactory;
class StateFactoryImpl {
    createState(name, defaultValue, options) {
        stateRegistry.register(name);
        return {
            " $name": name,
            " $stateType": "WRITABLE",
            " $parameterized": false,
            " $defaultValue": defaultValue,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    createParameterizedState(name, defaultValue, options) {
        stateRegistry.register(name);
        return {
            " $name": name,
            " $stateType": "WRITABLE",
            " $parameterized": true,
            " $defaultValue": defaultValue,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    createComputedState(name, valueSupplier, options) {
        stateRegistry.register(name);
        return {
            " $name": name,
            " $stateType": "COMPUTED",
            " $parameterized": false,
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    createParameterizedComputedState(name, valueSupplier, options) {
        stateRegistry.register(name);
        return {
            " $name": name,
            " $stateType": "COMPUTED",
            " $parameterized": true,
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    createAsyncState(name, valueSupplier, options) {
        stateRegistry.register(name);
        return {
            " $name": name,
            " $stateType": "ASYNC",
            " $parameterized": false,
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    createParameterizedAsyncState(name, valueSupplier, options) {
        stateRegistry.register(name);
        return {
            " $name": name,
            " $stateType": "ASYNC",
            " $parameterized": true,
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
}
function unsupportedOperation() {
    throw new Error("UnsupportedOperationException");
}
class StateRegistry {
    constructor() {
        this.nameVersionMap = new Map();
        this.version = 0;
        const win = window;
        const hotUpdate = win.webpackHotUpdate;
        if (typeof hotUpdate === "function") {
            win.hotUpdate = undefined;
            win.webpackHotUpdate = (...args) => {
                this.version++;
                hotUpdate.apply(this, args);
            };
        }
    }
    register(name) {
        const version = this.nameVersionMap.get(name);
        if (version !== undefined && version >= this.version) {
            throw new Error(`Duplicated state name "${name}"`);
        }
        this.nameVersionMap.set(name, this.version);
    }
}
const stateRegistry = new StateRegistry();
