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
            " $parameterized": false,
            " $defaultValue": defaultValue,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    createParameterizedState(defaultValue, options) {
        return {
            " $stateType": "WRITABLE",
            " $parameterized": true,
            " $defaultValue": defaultValue,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    createComputedState(valueSupplier, options) {
        return {
            " $stateType": "COMPUTED",
            " $parameterized": false,
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    createParameterizedComputedState(valueSupplier, options) {
        return {
            " $stateType": "COMPUTED",
            " $parameterized": true,
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    createAsyncState(valueSupplier, options) {
        return {
            " $stateType": "ASYNC",
            " $parameterized": false,
            " $valueSupplier": valueSupplier,
            " $options": options,
            " $supressWarnings": unsupportedOperation
        };
    }
    createParameterizedAsyncState(valueSupplier, options) {
        return {
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
