import 'antd/dist/antd.css';
import './App.css';
import { useCallback, useEffect, useState } from "react";
import { GraphStateMonitor } from "./components/GraphStateMonitor";
import { SimpleStateMonitor } from "./components/SimpleStateMonitor";
import { Message } from "./common/Model";
import { Tabs } from 'antd';
import { StateManagerIdContextProvider } from './components/StateManagerContext';
import { EvictLogMonitor } from './components/EvictLogMonitor';
import { EvictLogProvider } from './components/EvictLogProvider';

function App() {

    const [stateManagerId, setStateManagerId] = useState<string>();

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
                <EvictLogProvider>
                    <Tabs destroyInactiveTabPane={true}>
                        <Tabs.TabPane key="simple-state" tab="Simple states">
                            <SimpleStateMonitor/>
                        </Tabs.TabPane>
                        <Tabs.TabPane key="graph-state" tab="Graph states">
                            <GraphStateMonitor/>
                        </Tabs.TabPane>
                        <Tabs.TabPane key="evict-log" tab="Evict logs">
                            <EvictLogMonitor/>
                        </Tabs.TabPane>
                    </Tabs>
                </EvictLogProvider>
            </div>
        </StateManagerIdContextProvider>
    );
}

export default App;
