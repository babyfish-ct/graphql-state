import { createContext, FC, memo, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";
import { Message, RefetchLogMessage } from "../common/Model";
import { useStateManagerId } from "./StateManagerContext";

export const RefetchLogProvider: FC<
    PropsWithChildren<{}>
> = memo(({children}) => {

    const stateManagerId = useStateManagerId();

    const [logs, setLogs] = useState<Log[]>([]);

    const onMessage = useCallback((message: Message) => {
        if (message.messageDomain === 'graphQLStateMonitor' &&
            message.messageType === 'refetchLogCreate' &&
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
    }, []);

    useEffect(() => {
        setLogs([]);
        chrome.devtools.inspectedWindow.eval(MOUNT_SCRIPT);
        chrome.runtime.onMessage.addListener(onMessage);
        return () => {
            chrome.runtime.onMessage.removeListener(onMessage);
            chrome.devtools.inspectedWindow.eval(UNMOUNT_SCRIPT);
        }
    }, [stateManagerId, onMessage]);

    return (
        <refetchLogContext.Provider value={logs}>
            {children}
        </refetchLogContext.Provider>
    );
});

export interface Log extends RefetchLogMessage {
    readonly logId: number;
}

let logIdSequence = 0;

const MAX_COUNT = 200;

const MOUNT_SCRIPT = `
window.__GRAPHQL_STATE_MONITORS__ = {
    ...window.__GRAPHQL_STATE_MONITORS__,
    refetchLog: true
};`;

const UNMOUNT_SCRIPT = `
if (window.__GRAPHQL_STATE_MONITORS__) {
    delete window.__GRAPHQL_STATE_MONITORS__.refetchLog;
}`;

const refetchLogContext = createContext<Log[]>([]);

export function useLogs(): Log[] {
    return useContext(refetchLogContext);
}