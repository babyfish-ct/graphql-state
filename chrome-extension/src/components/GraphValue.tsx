import { Card } from "antd";
import { FC, memo } from "react";
import { GraphFieldMetadata } from "../common/Model";
import { createValueNode } from "../common/value";

export const GraphValue: FC<{
    readonly metadata?: GraphFieldMetadata,
    readonly value: any
}> = memo(({metadata, value}) => {
    
    return (
        <Card title="Selected field">
            <Core metadata={metadata} value={value}/>
        </Card>
    );
});

const Core: FC<{
    readonly metadata?: GraphFieldMetadata,
    readonly value: any
}> = memo(({metadata, value}) => {

    if (value === undefined || value === null) {
        return <>{createValueNode(undefined)}</>;
    }
    if (metadata?.isConnection === true) {
        const otherFields = Object.keys(value).filter(f => f !== "edges");
        return (
            <>
                {"{"}
                <div className="value-composite">
                    {
                        otherFields.map(field => 
                            <div key={field}>
                                {field}: {createValueNode(value[field])},
                            </div>
                        )
                    }
                    {
                        value.edges && <div>
                            edges: [
                                <div className="value-composite">
                                {
                                    value.edges.map((edge: any, index: number) => {
                                        return (
                                            <div key={index}>
                                                {"{"}
                                                    <div className="value-composite">
                                                        node: <Reference typeName={metadata!.targetTypeName!} id={edge.node}/>
                                                        { edge.cursor && <>cursor: { createValueNode(edge.cursor) }</> }
                                                    </div>
                                                {"}"}{ index < value.edges.length && "," }
                                            </div>
                                        );
                                    })
                                }
                                </div>
                            ]
                        </div>
                    }
                </div>
                {"}"}  
            </>
        );
    }
    if (metadata?.targetTypeName !== undefined) {
        if (Array.isArray(value)) {
            return (
                <>
                    [
                        <div className="value-composite">
                            {
                                value.map((element, index) => 
                                    <div key={index}>
                                        <Reference typeName={metadata.targetTypeName!} id={element}/>
                                        {index < value.length && ","}
                                    </div>
                                )
                            }
                        </div>
                    ]
                </>
            );
        }
        return <Reference typeName={metadata.targetTypeName!} id={value}/>
    }
    return <>{createValueNode(value)}</>;
});

const Reference: FC<{
    readonly typeName: string,
    readonly id: any
}> = memo(({typeName, id}) => {
    return <span>{createValueNode(id)}</span>;
});