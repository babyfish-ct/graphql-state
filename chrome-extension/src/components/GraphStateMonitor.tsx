import { Col, message, Row, Space } from "antd";
import produce from "immer";
import { FC, memo, useCallback, useEffect, useMemo, useState } from "react";
import { GraphFieldMetadata, GraphObject, GraphSnapshot, GraphTypeMetadata, Message } from "../common/Model";
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

    const [selectedObjectId, setSelectedObjectId] = useState<string>();

    const [selectedFieldId, setSelectedFieldId] = useState<string>();

    const onMessage = useCallback((message: Message) => {
        if (message.messageDomain === 'graphQLStateMonitor' &&
            message.messageType === 'graphStateChange' &&
            message.stateManagerId === stateManagerId
        ) {
            if (graphSnapshot.typeMetadataMap[message.typeName] === undefined) {
                chrome.devtools.inspectedWindow.eval(MOUNT_SCRIPT, (result, exceptionInfo) => {
                    if (result !== undefined) {
                        const snaphsot = result as GraphSnapshot
                        setGraphSnapshot(snaphsot);
                        if (snaphsot.typeMetadataMap[message.typeName] !== undefined) {
                            return;
                        }
                    }
                    throw new Error(`No metadata for the type name '${message.typeName}'`);
                });
                return;
            }
            setGraphSnapshot(old => produce(old, draft => {
                if (draft.typeMetadataMap[message.typeName] === undefined) {
                    throw { " $noMetadata": true };
                }
                changeGraphSnapshot(draft, message);
            }));
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
    }, [stateManagerId, selectedObjectId, graphSnapshot]);

    useEffect(() => {
        chrome.devtools.inspectedWindow.eval(MOUNT_SCRIPT, result => {
            if (result !== undefined) {
                setGraphSnapshot(result as GraphSnapshot);
            }
        });
        return () => {
            chrome.devtools.inspectedWindow.eval(UNMOUNT_SCRIPT);
        }
    }, [stateManagerId]);

    useEffect(() => {
        chrome.runtime.onMessage.addListener(onMessage);
        return () => {
            chrome.runtime.onMessage.removeListener(onMessage);
        }
    }, [onMessage]);

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
        const fieldIndex = binarySearch(obj.fields, "name", fieldName);
        if (fieldIndex < 0) {
            return [undefined, undefined, false];
        }
        const field = obj.fields[fieldIndex];
        const metadata = typeMetadata.fieldMap[fieldName];
        if (metadata?.isParamerized === true) {
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
                        onChange={setSelectedFieldId}/>
                        {
                            hasValue &&
                            <GraphValue metadata={fieldMetdata} value={value}/>
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