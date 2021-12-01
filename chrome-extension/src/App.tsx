import { Tab, Tabs } from "@material-ui/core";
import { useCallback, useEffect, useState } from "react";
import { GraphStateMonitor } from "./components/GraphStateMonitor";
import { SimpleStateMonitor } from "./components/SimpleStateMonitor";
import { Message } from "./common/Model";
import { version } from "process";

function App() {

    const [hasStateManager, setHasStateManager] = useState(false);

    const [stateManagerVersion, setStateManagerVersion] = useState(0);

    const [version, setVersion] = useState(0);

    const [tabValue, setTabValue] = useState("simple-state");

    const onTabChange = useCallback((_, value: string) => {
        setTabValue(value);
    }, []);

    const onMessage = useCallback((message: Message) => {
        if (message.messageDomain === 'graphQLStateMonitor' && 
            message.messageType === 'stateManagerChange' && (
                message.version === 0 || message.version >= stateManagerVersion
            )
        ) {
            setHasStateManager(message.has);
            setStateManagerVersion(message.version);
        }
    }, []);

    useEffect(() => {
        chrome.devtools.inspectedWindow.eval(
            `window.__STATE_MANAGER__ !== undefined`, 
            result => setHasStateManager(result as boolean)
        );
        chrome.runtime.onMessage.addListener(onMessage);
        return () => {
            chrome.runtime.onMessage.removeListener(onMessage);
        }
    }, [onMessage]);

    if (!hasStateManager) {
        return <div style={{textAlign: "center", fontSize: "2rem", margin: ".5rem"}}>Web page does not retain StateManager</div>;
    }
    return (
        <>
            <Tabs value={tabValue} onChange={onTabChange}>
                <Tab value="simple-state" label="Simple states"/>
                <Tab value="graph-state" label="Graph states"/>
            </Tabs>
            { tabValue === "simple-state" && <SimpleStateMonitor version={version}/> }
            { tabValue === "graph-state" && <GraphStateMonitor version={version}/> }
        </>
    );
}

export default App;
