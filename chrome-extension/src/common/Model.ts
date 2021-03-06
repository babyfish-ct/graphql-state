export type Message = StateManagerMessage | SimpleStateMessage | GraphStateMessage | EvictLogMessage;

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

export interface EvictLogMessage extends AbstractMessage {
    readonly messageType: "evictLogCreate";
    readonly stateManagerId: string;
    readonly typeName: string;
    readonly id: string;
    readonly field: string;
    readonly parameter: string;
    readonly targetTypeName?: string;
    readonly reason: EvictReasonType;
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

export type EvictReasonType =
    "unknown-owner" |
    "no-contains" |
    "no-range" |
    "contains-returns-undefined" |
    "position-returns-undefined" |
    "page-style-pagination" |
    "forward-tail" |
    "backward-head"
;