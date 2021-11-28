import { createContext, FC, memo, PropsWithChildren, useContext, useEffect } from "react";
import { StateManagerImpl } from "./impl/StateManagerImpl";
import { StateManager } from "./StateManager";
import { ReleasePolicy } from "./Types";

export const StateManagerProvider: FC<
    PropsWithChildren<{
        stateManager?: StateManager<any>,
        releasePolicy?: ReleasePolicy<any>
    }>
> = memo(({stateManager, releasePolicy, children}) => {

    const externalStateManager = useContext(stateContext);
    if (externalStateManager !== undefined) {
        throw new Error(`<StateManagerProvider/> is not allowed to be nested`);
    }

    const finallyUsedStateManager = stateManager as StateManagerImpl<any> ?? new StateManagerImpl<any>();
    if (releasePolicy !== undefined) {
        finallyUsedStateManager.releasePolicy = releasePolicy;
    }

    // Use this to debug before chrome extension to visualize the data is supported in the future
    (window as any).__STATE_MANAGER__ = finallyUsedStateManager;

    useEffect(() => {
        return () => {
            (window as any).__STATE_MANAGER__ = undefined;
            finallyUsedStateManager.dispose();
        }
    }, [finallyUsedStateManager]);

    return (
        <stateContext.Provider value={finallyUsedStateManager}>
            {children}
        </stateContext.Provider>
    );
});

export const stateContext = createContext<StateManagerImpl<any> | undefined>(undefined);
