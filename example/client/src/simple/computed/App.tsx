import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { InputView } from "./InputView";
import { OutputView } from "./OutputView";

export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <InputView/>
            <OutputView/>
        </StateManagerProvider>
    );
});