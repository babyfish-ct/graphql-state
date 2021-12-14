import { Button, Card } from "antd";
import { FC, memo, useCallback } from "react";
import { GraphFieldMetadata } from "../common/Model";
import { createValueNode } from "../common/value";

export const GraphValue: FC<{
    readonly metadata?: GraphFieldMetadata,
    readonly value: any,
    readonly onLink?: (selectObjectId: string) => void
}> = memo(props => {
    
    return (
        <Card title="Selected field">
            <Core {...props}/>
        </Card>
    );
});

const Core: FC<{
    readonly metadata?: GraphFieldMetadata,
    readonly value: any,
    readonly onLink?: (selectObjectId: string) => void
}> = memo(({metadata, value, onLink}) => {

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
                                                        node: <Reference typeName={metadata!.targetTypeName!} id={edge.node} onLink={onLink}/>
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
                                        <Reference typeName={metadata.targetTypeName!} id={element} onLink={onLink}/>
                                        {index < value.length && ","}
                                    </div>
                                )
                            }
                        </div>
                    ]
                </>
            );
        }
        return <Reference typeName={metadata.targetTypeName!} id={value} onLink={onLink}/>
    }
    return <>{createValueNode(value)}</>;
});

const Reference: FC<{
    readonly typeName: string,
    readonly id: any,
    readonly onLink?: (selectObjectId: string) => void
}> = memo(({typeName, id, onLink}) => {
    const onClick = useCallback(() => {
        if (onLink) {
            onLink(`${typeName}:${id}`);
        }
    }, [onLink, typeName, id]);
    return <Button type="link" onClick={onClick}>{createValueNode(id)}</Button>;
});