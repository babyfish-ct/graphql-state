import { createContext, FC, memo, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
            const log: Log = {...message, logId: logIdSequence++, time: new Date() };
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

    const deleteLog = useCallback((logId: number) => {
        setLogs(logs => logs.filter(log => log.logId !== logId));
    }, []);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    const contextValue = useMemo<EvictLogInfo>(() => {
        return {logs, deleteLog, clearLogs};
    }, [logs, deleteLog, clearLogs])

    return (
        <evictLogContext.Provider value={contextValue}>
            {children}
        </evictLogContext.Provider>
    );
});

export interface Log extends EvictLogMessage {
    readonly logId: number;
    readonly time: Date;
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

const evictLogContext = createContext<EvictLogInfo>({
    logs: [],
    deleteLog: (logId: number) => {},
    clearLogs: () => {}
});

export function useEvictLogInfo(): EvictLogInfo {
    return useContext(evictLogContext);
}

export interface EvictLogInfo {
    readonly logs: Log[];
    readonly deleteLog: (logId: number) => void;
    readonly clearLogs: () => void;
}