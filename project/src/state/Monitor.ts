import { EntityChangeEvent, EntityEvictEvent } from "..";
import { EntityKey } from "../entities/EntityEvent";
import { StateValue } from "./impl/StateValue";

export function postStateManagerMessage(stateManagerId?: string) {
    const message: StateManagerMessage =  {
        messageDomain: "graphQLStateMonitor",
        messageType: "stateManagerChange",
        stateManagerId
    };
    postMessage(message, "*");
}

export function postSimpleStateMessage(
    stateValue: StateValue,
    changeType: ChangeType,
    data?: any
) {
    if ((window as any).__GRAPHQL_STATE_MONITORS__?.simpleState === true) {
        const message: SimpleStateMessage = {
            messageDomain: "graphQLStateMonitor",
            messageType: "simpleStateChange",
            stateManagerId: stateValue.stateInstance.scopedStateManager.stateManager.id,
            changeType,
            scopePath: stateValue.stateInstance.scopedStateManager.path,
            name: stateValue.stateInstance.state[" $name"],
            parameter: stateValue.args?.key ?? (stateValue.stateInstance.state[" $parameterized"] ? "" : undefined),
            data: changeType === "update" ? data : undefined 
        };
        postMessage(message, "*");
    }
}

export function postGraphStateMessage(
    stateManagerId: string,
    event: EntityEvictEvent | EntityChangeEvent
) {
    if ((window as any).__GRAPHQL_STATE_MONITORS__?.graphState === true) {
        const fields: GraphEventField[] = [];
        if (event.eventType === "evict") {
            for (const key of event.evictedKeys) {
                const fieldKey = fieldKeyOf(key);
                const field: GraphEventField = {
                    fieldKey,
                    oldValue: event.evictedValue(key)
                };
                fields.push(field);
            }
        } else {
            for (const key of event.changedKeys) {
                const fieldKey = fieldKeyOf(key);
                const field: GraphEventField = {
                    fieldKey,
                    oldValue: event.changedType === 'insert' ? undefined : event.oldValue(key),
                    newValue: event.changedType === 'delete' ? undefined : event.newValue(key)
                };
                fields.push(field);
            }
        }
        const message: GraphStateMessage = {
            messageDomain: "graphQLStateMonitor",
            messageType: "graphStateChange",
            stateManagerId,
            changeType: event.eventType === 'evict' ? 
                (event.evictedType === 'row' ? 'evict-row' : 'evict-fields') :
                event.changedType,
            typeName: event.typeName,
            id: event.id,
            fields
        }
        postMessage(message, "*");
    }
}

export function isRefetchLogEnabled() {
    return (window as any).__GRAPHQL_STATE_MONITORS__?.refetchLog === true;
}

function fieldKeyOf(key: EntityKey): string {
    if (typeof key === 'string') {
        return key;
    }
    if (key.variables === undefined || key.variables === null) {
        return key.name;
    } 
    const parameter = JSON.stringify(key.variables);
    if (parameter === '{}') {
        return key.name;
    }
    return `${key.name}:${parameter}`;
}

export type Message = StateManagerMessage | SimpleStateMessage | GraphStateMessage | RefetchLogMessage;

interface AbstractMessage {
    readonly messageDomain: "graphQLStateMonitor";
}

export interface StateManagerMessage extends AbstractMessage {
    readonly messageType: "stateManagerChange";
    readonly stateManagerId?: string;
}

export interface SimpleStateMessage extends AbstractMessage {
    readonly messageType: "simpleStateChange";
    readonly stateManagerId: string;
    readonly changeType: ChangeType;
    readonly scopePath: string;
    readonly name: string;
    readonly parameter?: string;
    readonly data: any;
}

export interface GraphStateMessage extends AbstractMessage {
    readonly messageType: "graphStateChange";
    readonly stateManagerId: string;
    readonly changeType: "evict-row" | "evict-fields" | ChangeType;
    readonly typeName: string;
    readonly id: any;
    readonly fields: readonly GraphEventField[];
}

export interface RefetchLogMessage extends AbstractMessage {
    readonly messageType: "refetchLogCreate";
    readonly stateManagerId: string;
    readonly typeName: string;
    readonly id: string;
    readonly field: string;
    readonly parameter: string;
    readonly targetTypeName?: string;
    readonly reason: RefetchReasonType;
}

export interface SimpleStateScope {
    readonly name: string;
    readonly states: SimpleState[];
    readonly scopes: readonly SimpleStateScope[];
}

export interface SimpleState {
    readonly name: string;
    readonly value?: any;
    readonly parameterizedValues?: readonly ParameterizedValue[];
}

export interface GraphSnapshot {
    readonly typeMetadataMap: { readonly [key: string]: GraphTypeMetadata };
    readonly query?: GraphObject;
    readonly types: readonly GraphType[]; 
}

export interface GraphTypeMetadata {
    readonly name: string;
    readonly superTypeName?: string;
    readonly idFieldName?: string;
    readonly declaredFieldMap: { readonly [key: string]: GraphFieldMetadata };
}

export interface GraphFieldMetadata {
    readonly name: string;
    readonly isParamerized: boolean;
    readonly isConnection: boolean;
    readonly targetTypeName?: string;
}

export interface GraphType {
    readonly name: string;
    readonly objects: readonly GraphObject[];
}

export interface GraphObject {
    readonly id: string;
    readonly runtimeTypeName: string;
    readonly fields: readonly GraphField[];
}

export interface GraphField {
    readonly name: string;
    readonly value?: any;
    readonly parameterizedValues?: readonly ParameterizedValue[];
}

export type GraphValue = string | Readonly<string> | {
    readonly edges: ReadonlyArray<{
        readonly node: string,
        readonly [key: string]: any
    }>,
    readonly [key:string]: any
};

export interface ParameterizedValue {
    readonly parameter: string;
    readonly value?: any;
}

export interface GraphEventField {
    readonly fieldKey: string;
    readonly oldValue?: any;
    readonly newValue?: any;
}

export type ChangeType = "insert" | "delete" | "update";

export type RefetchReasonType =
    "unknown-owner" |
    "no-contains" |
    "no-range" |
    "contains-returns-undefined" |
    "position-returns-undefined" |
    "page-style-pagination" |
    "forward-tail" |
    "backward-head"
;