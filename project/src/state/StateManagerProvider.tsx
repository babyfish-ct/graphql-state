import { createContext, FC, memo, PropsWithChildren, useContext, useEffect } from "react";
import { useStateManager } from "..";
import { StateManagerImpl } from "./impl/StateManagerImpl";
import { StateManager } from "./StateManager";

export const StateManagerProvider: FC<
    PropsWithChildren<{
        stateManager?: StateManager<any>
    }>
> = memo(({stateManager, children}) => {

    const externalStateManager = useContext(stateContext);
    if (externalStateManager !== undefined) {
        throw new Error(`<StateManagerProvider/> is not allowed to be nested`);
    }

    const finallyUsedStateManager = stateManager as StateManagerImpl<any> ?? new StateManagerImpl<any>();

    useEffect(() => {
        return () => {
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
