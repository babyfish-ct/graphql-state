import { createContext, FC, memo, PropsWithChildren } from "react";
import { StateManager } from "./StateManager";

export const StateManagerProvider: FC<
    PropsWithChildren<{
        manager: StateManager
    }>
> = memo(({manager, children}) => {
    return (
        <stateContext.Provider value={manager}>
            {children}
        </stateContext.Provider>
    );
});

export const stateContext = createContext<StateManager | undefined>(undefined);