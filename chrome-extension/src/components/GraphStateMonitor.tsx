import { FC, memo, useEffect } from "react";

export const GraphStateMonitor: FC<{
    readonly version: number
}> = memo(({version}) => {

    useEffect(() => {
        chrome.devtools.inspectedWindow.eval(MOUNT_SCRIPT, result => {
            if (result !== undefined) {
                
            }
        });
        return () => {
            chrome.devtools.inspectedWindow.eval(UNMOUNT_SCRIPT);
        }
    }, [version]);

    return (
        <div>Graph state monitor</div>
    );
});

const MOUNT_SCRIPT = `(function() {
    window.__GRAPHQL_STATE_MONITORS__ = {
        ...window.__GRAPHQL_STATE_MONITORS__,
        graphState: true
    };
    if (window.__STATE_MANAGER__) {
        return __STATE_MANAGER__.simpleStateMonitor();
    }
    return undefined;
})()`;

const UNMOUNT_SCRIPT = `
if (window.__GRAPHQL_STATE_MONITORS__) {
    delete window.__GRAPHQL_STATE_MONITORS__.graphState;
}`;