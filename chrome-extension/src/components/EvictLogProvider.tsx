import { createContext, FC, memo, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";
import { Message, EvictLogMessage } from "../common/Model";
import { useStateManagerId } from "./StateManagerContext";

export const EvictLogProvider: FC<
    PropsWithChildren<{}>
> = memo(({children}) => {

    const stateManagerId = useStateManagerId();

    const [logs, setLogs] = useState<Log[]>([]);

    const onMessage = useCallback((message: Message) => {
        if (message.messageDomain === 'graphQLStateMonitor' &&
            message.messageType === 'evictLogCreate' &&
            message.stateManagerId === stateManagerId
        ) {
            const log: Log = {...message, logId: logIdSequence++};
            setLogs(oldLogs => {
                const arr = [log, ...oldLogs];
                if (arr.length > MAX_COUNT) {
                    arr.splice(MAX_COUNT, arr.length - MAX_COUNT);
                }
                return arr;
            });
        }
    }, [stateManagerId]);

    useEffect(() => {
        setLogs([]);
        chrome.devtools.inspectedWindow.eval(MOUNT_SCRIPT);
        chrome.runtime.onMessage.addListener(onMessage);
        return () => {
            chrome.runtime.onMessage.removeListener(onMessage);
            chrome.devtools.inspectedWindow.eval(UNMOUNT_SCRIPT);
        }
    }, [onMessage]);

    return (
        <evictLogContext.Provider value={logs}>
            {children}
        </evictLogContext.Provider>
    );
});

export interface Log extends EvictLogMessage {
    readonly logId: number;
}

let logIdSequence = 0;

const MAX_COUNT = 200;

const MOUNT_SCRIPT = `
window.__GRAPHQL_STATE_MONITORS__ = {
    ...window.__GRAPHQL_STATE_MONITORS__,
    evictLog: true
};`;

const UNMOUNT_SCRIPT = `
if (window.__GRAPHQL_STATE_MONITORS__) {
    delete window.__GRAPHQL_STATE_MONITORS__.evictLog;
}`;

const evictLogContext = createContext<Log[]>([]);

export function useLogs(): Log[] {
    return useContext(evictLogContext);
}