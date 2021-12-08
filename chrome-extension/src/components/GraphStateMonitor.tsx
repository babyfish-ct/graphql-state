import { Col, Result, Row, Space } from "antd";
import produce from "immer";
import { FC, memo, useCallback, useEffect, useMemo, useState } from "react";
import { GraphFieldMetadata, GraphObject, GraphSnapshot, GraphStateMessage, GraphTypeMetadata, Message } from "../common/Model";
import { binarySearch, changeGraphSnapshot } from "../common/util";
import { GraphFieldTree } from "./GraphFieldTree";
import { GraphObjectTree } from "./GraphObjectTree";
import { GraphValue } from "./GraphValue";
import { useStateManagerId } from "./StateManagerContext";

export const GraphStateMonitor: FC = memo(() => {

    const stateManagerId = useStateManagerId();

    const [graphSnapshot, setGraphSnapshot] = useState<GraphSnapshot>({
        typeMetadataMap: {},
        types: []
    });

    const [error, setError] = useState(false);

    const [selectedObjectId, setSelectedObjectId] = useState<string>();

    const [selectedFieldId, setSelectedFieldId] = useState<string>();

    const [initializing, setInitializing] = useState(false);

    const [, setDelayedMessages] = useState<GraphStateMessage[]>([]);

    const initializeSnapshot = useCallback(() => {
        setInitializing(true);
        chrome.devtools.inspectedWindow.eval(MOUNT_SCRIPT, (result, exceptionInfo) => {
            if (result !== undefined) {
                setGraphSnapshot(result as GraphSnapshot);
                setError(false);
            } else {
                setError(true);
            }
            setInitializing(false);
            setDelayedMessages(messages => {
                try {
                    if (messages.length !== 0) {
                        for (const message of messages) {
                            setGraphSnapshot(old => produce(old, draft => {
                                changeGraphSnapshot(draft, message);
                            }));
                        }
                    }
                } finally {
                    return [];
                }
            });
        });
    }, []);

    const onSyncSnapshot = useCallback((message: Message) => {
        if (message.messageDomain === 'graphQLStateMonitor' &&
            message.messageType === 'graphStateChange' &&
            message.stateManagerId === stateManagerId
        ) {
            if (initializing) {
                setDelayedMessages(old => [...old, message]);
            } else if (graphSnapshot.typeMetadataMap[message.typeName] === undefined) {
                initializeSnapshot();
            } else {
                setGraphSnapshot(produce(graphSnapshot, draft => {
                    changeGraphSnapshot(draft, message);
                }));
            }
        }
    }, [stateManagerId, graphSnapshot, initializing, initializeSnapshot]);

    const onClearSelection = useCallback((message: Message) => {
        if (message.messageDomain === 'graphQLStateMonitor' &&
            message.messageType === 'graphStateChange' &&
            message.stateManagerId === stateManagerId
        ) {
            if (message.changeType === 'evict-row' || message.changeType === 'delete') {
                if (selectedObjectId !== undefined && selectedObjectId === `${message.typeName}:${message.id}`) {
                    setSelectedObjectId(undefined);
                    setSelectedFieldId(undefined);
                }
            } else if (message.changeType === 'evict-fields') {
                if (selectedFieldId !== undefined && message.fields.find(f => f.fieldKey === selectedFieldId)) {
                    setSelectedFieldId(undefined);
                }
            }
        }
    }, [stateManagerId, graphSnapshot, selectedObjectId, selectedFieldId]);

    useEffect(() => {
        initializeSnapshot();
        return () => {
            chrome.devtools.inspectedWindow.eval(UNMOUNT_SCRIPT);
        };
    }, [initializeSnapshot, stateManagerId]);

    useEffect(() => {
        chrome.runtime.onMessage.addListener(onSyncSnapshot);
        return () => {
            chrome.runtime.onMessage.removeListener(onSyncSnapshot);
        }
    }, [onSyncSnapshot]);

    useEffect(() => {
        chrome.runtime.onMessage.addListener(onClearSelection);
        return () => {
            chrome.runtime.onMessage.removeListener(onClearSelection);
        }
    }, [onClearSelection]);

    const [typeMetadata, obj] = useMemo<[GraphTypeMetadata | undefined, GraphObject | undefined]>(() => {
        if (selectedObjectId === undefined) {
            return [undefined, undefined];
        }
        const colonIndex = selectedObjectId.indexOf(':');
        if (colonIndex === -1) {
            return [undefined, undefined];
        }
        const typeName = selectedObjectId.substring(0, colonIndex);
        const id = selectedObjectId.substring(colonIndex + 1);
        const metadata = graphSnapshot.typeMetadataMap[typeName];
        if (metadata === undefined) {
            return [undefined, undefined];
        }
        if (typeName === "Query") {
            const query = graphSnapshot.query;
            if (query === undefined) { 
                return [undefined, undefined];
            }
            return [metadata, query];
        }
        const typeIndex = binarySearch(graphSnapshot.types, "name", typeName);
        if (typeIndex < 0) {
            return [undefined, undefined];
        }
        const type = graphSnapshot.types[typeIndex];
        const objIndex = binarySearch(type.objects, "id", id);
        if (objIndex < 0) {
            return [undefined, undefined];
        }
        return [metadata, type.objects[objIndex]];
    }, [selectedObjectId, graphSnapshot]);

    const [fieldMetdata, value, hasValue] = useMemo<[GraphFieldMetadata | undefined, any, boolean]>(() => {
        if (selectedFieldId === undefined || typeMetadata === undefined || obj === undefined) {
            return [undefined, undefined, false];    
        }
        if (selectedFieldId === "id") {
            return [undefined, obj.id, true];
        }
        const colonIndex = selectedFieldId.indexOf(":");
        if (colonIndex === -1) {
            return [undefined, undefined, false];
        }
        const fieldName = selectedFieldId.substring(0, colonIndex);
        const parameter = selectedFieldId.substring(colonIndex + 1);
        const metadata = typeMetadata.declaredFieldMap[fieldName];
        if (metadata === undefined) {
            return [undefined, undefined, false];
        }
        const fieldIndex = binarySearch(obj.fields, "name", fieldName);
        if (fieldIndex < 0) {
            return [undefined, undefined, false];
        }
        const field = obj.fields[fieldIndex];
        if (metadata.isParamerized) {
            if (field.parameterizedValues !== undefined) {
                const parameterIndex = binarySearch(field.parameterizedValues, "parameter", parameter);
                if (parameterIndex >= 0) {
                    return [metadata, field.parameterizedValues[parameterIndex].value, true];
                }
            }
            return [undefined, undefined, false];
        } else {
            return [metadata, field.value, true];
        }
    }, [selectedFieldId, typeMetadata, obj]);

    if (error) {
        return <Result status="error" title="Cannot send whole simple state tree to chrome devtools"/>;
    }
    return (
        <Row gutter={[10, 10]}>
            <Col xs={24} sm={12}>
                <GraphObjectTree 
                snapshot={graphSnapshot} 
                value={selectedObjectId} 
                onChange={setSelectedObjectId}/>
            </Col>
            <Col xs={24} sm={12}>
                {
                    typeMetadata && obj &&
                    <Space className="full-width" direction="vertical">
                        <GraphFieldTree 
                        typeMetadata={typeMetadata} 
                        obj={obj} 
                        value={selectedFieldId} 
                        onChange={setSelectedFieldId}
                        onLink={setSelectedObjectId}/>
                        {
                            hasValue &&
                            <GraphValue metadata={fieldMetdata} value={value} onLink={setSelectedObjectId}/>
                        }
                    </Space>
                }
            </Col>
        </Row>
    );
});

const MOUNT_SCRIPT = `(function() {
    window.__GRAPHQL_STATE_MONITORS__ = {
        ...window.__GRAPHQL_STATE_MONITORS__,
        graphState: true
    };
    if (window.__STATE_MANAGER__) {
        return __STATE_MANAGER__.graphStateMonitor();
    }
    return undefined;
})()`;

const UNMOUNT_SCRIPT = `
if (window.__GRAPHQL_STATE_MONITORS__) {
    delete window.__GRAPHQL_STATE_MONITORS__.graphState;
}`;