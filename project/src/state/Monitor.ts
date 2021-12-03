import { EntityChangeEvent, EntityEvictEvent } from "..";
import { EntityKey } from "../entities/EntityEvent";
import { StateValue } from "./impl/StateValue";
import { compare } from "./impl/util";

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
        const fields: GraphRowField[] = [];
        if (event.eventType === "evict") {
            for (const key of event.evictedKeys) {
                const fieldKey = fieldKeyOf(key);
                const field: GraphRowField = {
                    fieldKey,
                    oldValue: event.evictedValue(key)
                };
                fields.push(field);
            }
        } else {
            for (const key of event.changedKeys) {
                const fieldKey = fieldKeyOf(key);
                const field: GraphRowField = {
                    fieldKey,
                    oldValue: event.changedType === 'insert' ? undefined : event.oldValue(key),
                    newValue: event.changedType === 'delete' ? undefined : event.newValue(key)
                };
                fields.push(field);
            }
        }
        fields.sort((a, b) => compare(a, b, "fieldKey"));
        const message: GraphStateMessage = {
            messageDomain: "graphQLStateMonitor",
            messageType: "graphStateChange",
            stateManagerId,
            changeType: event.eventType === 'evict' ? 
                (event.evictedType === 'row' ? 'evict-row' : 'evict-fields') :
                event.changedType,
            typeName: event.typeName,
            id: event.typeName,
            fields
        }
        postMessage(message, "*");
    }
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

export type Message = StateManagerMessage | SimpleStateMessage | GraphStateMessage;

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
    readonly fields: readonly GraphRowField[];
}

export interface SimpleStateScope {
    readonly name: string;
    readonly states: SimpleState[];
    readonly scopes: readonly SimpleStateScope[];
}

export interface SimpleState {
    readonly name: string;
    readonly value?: any;
    readonly parameterizedValues?: readonly SimpleStateParameterizedValue[];
}

export interface SimpleStateParameterizedValue {
    readonly parameter: string;
    readonly value: any;
}

export interface GraphRowField {
    readonly fieldKey: string;
    readonly oldValue?: any;
    readonly newValue?: any;
}

export type ChangeType = "insert" | "delete" | "update";