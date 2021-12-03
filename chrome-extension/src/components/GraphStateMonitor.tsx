import { FC, memo, useCallback, useEffect, useState } from "react";
import { Message } from "../common/Model";
import { useStateManagerId } from "./StateManagerContext";

export const GraphStateMonitor: FC = memo(() => {

    const stateManagerId = useStateManagerId();

    const [messages, setMessages] = useState<Message[]>([]);

    const onMessage = useCallback((message: Message) => {
        if (message.messageDomain === 'graphQLStateMonitor' &&
            message.messageType === 'graphStateChange' &&
            message.stateManagerId === stateManagerId
        ) {
            setMessages(old => [...old, message]);
        }
    }, [stateManagerId]);

    useEffect(() => {
        chrome.devtools.inspectedWindow.eval(MOUNT_SCRIPT, result => {
            
        });
        chrome.runtime.onMessage.addListener(onMessage);
        return () => {
            chrome.runtime.onMessage.removeListener(onMessage);
            chrome.devtools.inspectedWindow.eval(UNMOUNT_SCRIPT);
        }
    }, [onMessage]);

    return (
        <div>
            Graph state monitor
            <hr/>
            {JSON.stringify(messages)}
        </div>
    );
});

const MOUNT_SCRIPT = `(function() {
    window.__GRAPHQL_STATE_MONITORS__ = {
        ...window.__GRAPHQL_STATE_MONITORS__,
        graphState: true
    };
    
    return undefined;
})()`;

const UNMOUNT_SCRIPT = `
if (window.__GRAPHQL_STATE_MONITORS__) {
    delete window.__GRAPHQL_STATE_MONITORS__.graphState;
}`;