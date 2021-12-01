import produce from "immer";
import { FC, memo, useCallback, useEffect, useState } from "react";
import { Message, SimpleStateScope } from "../common/Model";
import { getOrCreateScopeByPath, removeScopeByPath, setScopeValue } from "../common/util";

export const SimpleStateMonitor: FC<{
    readonly version: number
}> = memo(({version}) => {

    const [scope, setScope] = useState<SimpleStateScope>({
        name: "",
        states: [],
        scopes: []
    });

    const onMessage = useCallback((message: Message) => {
        if (message.messageDomain === 'graphQLStateMonitor' && message.messageType === 'simpleStateChange') {
            setScope(old => produce(old, draft => {
                if (message.changeType === "delete") {
                    removeScopeByPath(draft, message.scopePath);
                } else {
                    const scope = getOrCreateScopeByPath(draft, message.scopePath);
                    setScopeValue(scope, message.name, message.parameter, message.data);
                }
            }));
        }
    }, []);

    useEffect(() => {
        chrome.devtools.inspectedWindow.eval(MOUNT_SCRIPT, result => {
            if (result !== undefined) {
                setScope(result as SimpleStateScope);
            }
        });
        chrome.runtime.onMessage.addListener(onMessage);
        return () => {
            chrome.runtime.onMessage.removeListener(onMessage);
            chrome.devtools.inspectedWindow.eval(UNMOUNT_SCRIPT);
        }
    }, [version]);

    return (
        <div>{JSON.stringify(scope)}</div>
    );
});

const MOUNT_SCRIPT = `(function() {
    window.__GRAPHQL_STATE_MONITORS__ = {
        ...window.__GRAPHQL_STATE_MONITORS__,
        simpleState: true
    };
    if (window.__STATE_MANAGER__) {
        return __STATE_MANAGER__.simpleStateMonitor();
    }
    return undefined;
})()`;

const UNMOUNT_SCRIPT = `
if (window.__GRAPHQL_STATE_MONITORS__) {
    delete window.__GRAPHQL_STATE_MONITORS__.simpleState;
}`;
