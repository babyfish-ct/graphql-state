import { Children, FC, memo, PropsWithChildren } from "react";
import { StateManagerImpl } from "./impl/StateManagerImpl";
import { useStateManager } from "./StateHook";

export const StateScope: FC<
    PropsWithChildren<{}>
> = memo(({children}) => {
    const stateManagerImpl = useStateManager() as StateManagerImpl<any>;
    return stateManagerImpl.scope(() => {
        return (
            <>
                {children}
            </>
        );
    });
});