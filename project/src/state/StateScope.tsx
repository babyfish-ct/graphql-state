import { Children, FC, memo, PropsWithChildren, useEffect, useState } from "react";
import { StateManagerImpl } from "./impl/StateManagerImpl";
import { useStateManager } from "./StateHook";

export const StateScope: FC<
    PropsWithChildren<{}>
> = memo(({children}) => {
    
    const stateManagerImpl = useStateManager() as StateManagerImpl<any>;
    const [scopedStateManager] = useState(() => stateManagerImpl.createScope());

    return stateManagerImpl.usingScope(scopedStateManager, () => {
        return (
            <>
                {children}
            </>
        );
    });
});