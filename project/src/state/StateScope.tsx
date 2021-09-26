import { Children, FC, memo, PropsWithChildren, useEffect, useState } from "react";
import { StateManagerImpl } from "./impl/StateManagerImpl";
import { useStateManager } from "./StateHook";

export const StateScope: FC<
    PropsWithChildren<{}>
> = memo(({children}) => {
    
    const stateManagerImpl = useStateManager() as StateManagerImpl<any>;

    const [scopeReady, setScopeReady] = useState(false);
    useEffect(() => {
        const scopedStateManager = stateManagerImpl.registerScope();
        setScopeReady(true);
        return () => {
            stateManagerImpl.unregisterScope(scopedStateManager);
        }
    }, []);

    /*
     * The mounting logic of useEffect is executed by wrong order: Child first, parent later.
     *
     * But for scope registration, parent mounted before child is very important,
     * so "scopeReady" is used to guarantee that parent is always mounted before child
     * 
     * The unmouting logic has the same problem, please view  "stateManagerImpl.unregisterScope" to know more
     */
    return <>{ scopeReady && children}</>;
});