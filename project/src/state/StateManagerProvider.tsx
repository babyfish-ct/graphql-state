import { createContext, FC, memo, PropsWithChildren } from "react";
import { StateManager } from "./StateManager";
import { StateScope } from "./StateScope";

export const StateManagerProvider: FC<
    PropsWithChildren<{
        manager: StateManager<any>
    }>
> = memo(({manager, children}) => {
    return (
        <stateContext.Provider value={manager}>
            <StateScope>
                {children}
            </StateScope>
        </stateContext.Provider>
    );
});

export const stateContext = createContext<StateManager<any> | undefined>(undefined);