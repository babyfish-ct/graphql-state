import { createContext, FC, memo, PropsWithChildren } from "react";
import { StateManagerImpl } from "./impl/StateManagerImpl";
import { StateManager } from "./StateManager";
import { StateScope } from "./StateScope";

export const StateManagerProvider: FC<
    PropsWithChildren<{
        manager?: StateManager<any>
    }>
> = memo(({manager, children}) => {
    return (
        <stateContext.Provider value={manager ?? defaultStateManager}>
            <StateScope>
                {children}
            </StateScope>
        </stateContext.Provider>
    );
});

export const stateContext = createContext<StateManager<any> | undefined>(undefined);

const defaultStateManager = new StateManagerImpl<any>();