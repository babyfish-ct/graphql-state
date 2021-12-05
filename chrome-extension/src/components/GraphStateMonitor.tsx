import { Col, Row } from "antd";
import produce from "immer";
import { FC, memo, useCallback, useEffect, useMemo, useState } from "react";
import { GraphObject, GraphSnapshot, GraphTypeMetadata, Message } from "../common/Model";
import { binarySearch, changeGraphSnapshot } from "../common/util";
import { GraphFieldTree } from "./GraphFieldTree";
import { GraphObjectTree } from "./GraphObjectTree";
import { useStateManagerId } from "./StateManagerContext";

export const GraphStateMonitor: FC = memo(() => {

    const stateManagerId = useStateManagerId();

    const [graphSnapshot, setGraphSnapshot] = useState<GraphSnapshot>({
        typeMetadataMap: {},
        types: []
    });

    const [selectedId, setSelectedId] = useState<string>();

    const onMessage = useCallback((message: Message) => {
        if (message.messageDomain === 'graphQLStateMonitor' &&
            message.messageType === 'graphStateChange' &&
            message.stateManagerId === stateManagerId
        ) {
            setGraphSnapshot(old => produce(old, draft => {
                changeGraphSnapshot(draft, message);
            }));
        }
    }, [stateManagerId]);

    useEffect(() => {
        chrome.devtools.inspectedWindow.eval(MOUNT_SCRIPT, result => {
            if (result !== undefined) {
                setGraphSnapshot(result as GraphSnapshot);
            }
        });
        chrome.runtime.onMessage.addListener(onMessage);
        return () => {
            chrome.runtime.onMessage.removeListener(onMessage);
            chrome.devtools.inspectedWindow.eval(UNMOUNT_SCRIPT);
        }
    }, [onMessage]);

    const [typeMetadata, obj] = useMemo<[GraphTypeMetadata | undefined, GraphObject | undefined]>(() => {
        if (selectedId === undefined) {
            return [undefined, undefined];
        }
        const colonIndex = selectedId.indexOf(':');
        if (colonIndex === -1) {
            return [undefined, undefined];
        }
        const typeName = selectedId.substring(0, colonIndex);
        const id = selectedId.substring(colonIndex + 1);
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
    }, [selectedId, graphSnapshot]);

    return (
        <Row gutter={[10, 10]}>
            <Col xs={24} sm={12}>
                <GraphObjectTree snapshot={graphSnapshot} value={selectedId} onChange={setSelectedId}/>
            </Col>
            <Col xs={24} sm={12}>
                {
                    typeMetadata && obj &&
                    <GraphFieldTree typeMetadata={typeMetadata} obj={obj}/>
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