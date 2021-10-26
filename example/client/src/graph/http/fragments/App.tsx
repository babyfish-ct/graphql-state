import { StateManagerProvider } from "graphql-state";
import { FC, memo } from "react";
import { newTypedConfiguration } from "../../__generated_graphql_schema__";

const stateManager = newTypedConfiguration().buildStateManager();

export const App: FC = memo(() => {

    return (
        <StateManagerProvider stateManager={stateManager}>

        </StateManagerProvider>
    ); 
});