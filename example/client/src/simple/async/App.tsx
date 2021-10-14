import { FC, memo, Suspense } from "react";
import { StateManagerProvider } from "graphql-state";
import { InputView } from "./InputView";
import { OutputViewForSuspenseStyle } from "./OutputViewForSuspenseStyle";
import { Spin } from "antd";
import { OutputViewForAsyncObjectStyle } from "./OutputViewForAsyncObjectStyle copy";
import { css } from "@emotion/css";

export const App: FC = memo(() => {
    return (
        <StateManagerProvider>

            <InputView/>

            <Suspense fallback={
                <div className={css({margin: "1rem", padding: "1rem", backgroundColor: "white"})}>
                    <Spin/>
                    Loading...(Implemented by of &lt;Suspense/&gt;)
                </div>
            }>
                <OutputViewForSuspenseStyle/>
            </Suspense>
            
            <OutputViewForAsyncObjectStyle/>

        </StateManagerProvider>
    );
});