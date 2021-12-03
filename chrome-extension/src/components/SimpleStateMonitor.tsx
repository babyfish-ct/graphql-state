import produce from "immer";
import { Card, Col, Row } from "antd";
import { FC, memo, useCallback, useEffect, useState } from "react";
import { Message, SimpleStateScope } from "../common/Model";
import { getOrCreateScopeByPath, removeScopeByPath, setScopeValue } from "../common/util";
import { SimpleStateTree } from "./SimpleStateTree";
import { useStateManagerId } from "./StateManagerContext";

export const SimpleStateMonitor: FC = memo(() => {

    const stateManagerId = useStateManagerId();

    const [scope, setScope] = useState<SimpleStateScope>({
        name: "",
        states: [],
        scopes: []
    });

    const onMessage = useCallback((message: Message) => {
        if (message.messageDomain === 'graphQLStateMonitor' &&
            message.messageType === 'simpleStateChange' &&
            message.stateManagerId === stateManagerId
        ) {
            setScope(old => produce(old, draft => {
                if (message.changeType === "delete") {
                    removeScopeByPath(draft, message.scopePath);
                } else {
                    const scope = getOrCreateScopeByPath(draft, message.scopePath);
                    setScopeValue(scope, message.name, message.parameter, message.data);
                }
            }));
        }
    }, [stateManagerId]);

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
    }, [onMessage]);

    return (
        <Row gutter={[10, 10]}>
            <Col xs={24} sm={12}>
                <SimpleStateTree scope={scope}/>
            </Col>
            <Col xs={24} sm={12}>
                <Card title="selected state value">

                </Card>
            </Col>
        </Row>
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
