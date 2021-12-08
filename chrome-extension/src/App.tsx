import 'antd/dist/antd.css';
import './App.css';
import { useCallback, useEffect, useState } from "react";
import { GraphStateMonitor } from "./components/GraphStateMonitor";
import { SimpleStateMonitor } from "./components/SimpleStateMonitor";
import { Message } from "./common/Model";
import { Tabs } from 'antd';
import { StateManagerIdContextProvider } from './components/StateManagerContext';
import { RefetchLogMonitor } from './components/RefetchLogMonitor';
import { RefetchLogProvider } from './components/RefetchLogProvider';

function App() {

    const [stateManagerId, setStateManagerId] = useState<string>();

    const [tabKey, setTabKey] = useState("simple-state");

    const onTabChange = useCallback((key: string) => {
        setTabKey(key);
    }, []);

    const onMessage = useCallback((message: Message) => {
        if (message.messageDomain === 'graphQLStateMonitor' && message.messageType === 'stateManagerChange') {
            setStateManagerId(message.stateManagerId);
        }
    }, []);

    useEffect(() => {
        chrome.devtools.inspectedWindow.eval(
            `window.__STATE_MANAGER__?.id`, 
            result => setStateManagerId(result as string | undefined)
        );
        chrome.runtime.onMessage.addListener(onMessage);
        return () => {
            chrome.runtime.onMessage.removeListener(onMessage);
        }
    }, [onMessage]);

    if (stateManagerId === undefined) {
        return <div style={{textAlign: "center", fontSize: "2rem", margin: ".5rem"}}>Web page does not retain StateManager</div>;
    }
    return (
        <StateManagerIdContextProvider value={stateManagerId}>
            <div style={{padding: 10}}>
                <RefetchLogProvider>
                    <Tabs activeKey={tabKey} onChange={onTabChange} destroyInactiveTabPane={true}>
                        <Tabs.TabPane key="simple-state" tab="Simple states">
                            <SimpleStateMonitor/>
                        </Tabs.TabPane>
                        <Tabs.TabPane key="graph-state" tab="Graph states">
                            <GraphStateMonitor/>
                        </Tabs.TabPane>
                        <Tabs.TabPane key="refetch-log" tab="Refetch logs">
                            <RefetchLogMonitor/>
                        </Tabs.TabPane>
                    </Tabs>
                </RefetchLogProvider>
            </div>
        </StateManagerIdContextProvider>
    );
}

export default App;
