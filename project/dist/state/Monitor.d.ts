import { StateValue } from "./impl/StateValue";
export declare function postStateManagerMessage(stateManagerId?: string): void;
export declare function postSimpleStateMessage(stateValue: StateValue, changeType: ChangeType, data?: any): void;
export declare type Message = StateManagerMessage | SimpleStateMessage;
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
export declare type ChangeType = "insert" | "delete" | "update";
export {};
