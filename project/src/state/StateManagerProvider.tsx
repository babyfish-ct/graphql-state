import { createContext, FC, memo, PropsWithChildren, useContext, useEffect } from "react";
import { StateManagerImpl } from "./impl/StateManagerImpl";
import { postStateManagerMessage } from "./Monitor";
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

    useEffect(() => {
        
        (window as any).__STATE_MANAGER__ = finallyUsedStateManager;
        setTimeout(() => {
            postStateManagerMessage(finallyUsedStateManager.id);
        }, 0);

        return () => {
            (window as any).__STATE_MANAGER__ = undefined;
            postStateManagerMessage(undefined);
            finallyUsedStateManager.dispose();
        }
    }, [finallyUsedStateManager.id]);

    return (
        <stateContext.Provider value={finallyUsedStateManager}>
            {children}
        </stateContext.Provider>
    );
});

export const stateContext = createContext<StateManagerImpl<any> | undefined>(undefined);
