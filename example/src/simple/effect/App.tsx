import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { WindowSizeView } from "./WindowSizeView";

export const App: FC = memo(() => {
    
    return (
        <StateManagerProvider>
            <WindowSizeView/>
        </StateManagerProvider>
    );
});
