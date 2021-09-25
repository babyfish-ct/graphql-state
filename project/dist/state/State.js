"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeStateFactory = void 0;
function makeStateFactory() {
    return new StateFactoryImpl();
}
exports.makeStateFactory = makeStateFactory;
class StateFactoryImpl {
    createState(defaultValue, options) {
        return {
            " $stateType": "WRITABLE",
            " $defaultValue": defaultValue,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    createComputedState(valueSupplier, options) {
        return {
            " $stateType": "COMPUTED",
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    createAsyncState(valueSupplier, options) {
        return {
            " $stateType": "ASYNC",
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
}
function unsupportedOperation() {
    throw new Error("UnsupportedOperationException");
}
