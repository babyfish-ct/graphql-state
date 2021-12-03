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

export type Message = StateManagerMessage | SimpleStateMessage;

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
    readonly changeType: ChangeType,
    readonly scopePath: string;
    readonly name: string;
    readonly parameter?: string;
    readonly data: any;
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

export type ChangeType = "insert" | "delete" | "update";