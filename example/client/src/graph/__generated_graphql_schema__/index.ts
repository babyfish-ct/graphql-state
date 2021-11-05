import { StateManager, makeStateFactory, makeManagedObjectHooks, useStateManager } from 'graphql-state';
import type { Schema } from "./TypedConfiguration";
export type { Schema } from "./TypedConfiguration";
export type { ImplementationType } from './CommonTypes';
export { upcastTypes, downcastTypes } from './CommonTypes';

const {
    createState,
    createParameterizedState,
    createComputedState,
    createParameterizedComputedState,
    createAsyncState,
    createParameterizedAsyncState
} = makeStateFactory<Schema>();

export {
    createState,
    createParameterizedState,
    createComputedState,
    createParameterizedComputedState,
    createAsyncState,
    createParameterizedAsyncState
};

const { useObject, useObjects } = makeManagedObjectHooks<Schema>();

export { useObject, useObjects };

export function useTypedStateManager(): StateManager<Schema> {
    return useStateManager<Schema>();
}

export { newTypedConfiguration} from "./TypedConfiguration";
