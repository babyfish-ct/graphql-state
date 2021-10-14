import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { WindowSizeView1 } from "./WindowSizeView1";
import { WindowSizeView2 } from "./WindowSizeView2";

export const App: FC = memo(() => {
    
    return (
        <StateManagerProvider>
            <WindowSizeView1/>
            <WindowSizeView2/>
        </StateManagerProvider>
    );
});
