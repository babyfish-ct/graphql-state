export { Configuration } from './meta/Configuration';
export { newConfiguration } from './meta/impl/ConfigurationImpl';
export { StateManager } from './state/StateManager';
export { makeStateFactory } from './state/State';
export { useStateManager, useStateValue, useStateAccessor, useStateAsyncValue, makeManagedObjectHooks } from './state/StateHook';
export { StateManagerProvider } from './state/StateManagerProvider';
export { StateScope } from './state/StateScope';
export { EntityChangeEvent } from './entities/EntityChangeEvent';
