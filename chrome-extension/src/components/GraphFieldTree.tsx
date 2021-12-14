import { LineOutlined, TagFilled, TagsOutlined } from "@ant-design/icons";
import { Button, Card, Tree } from "antd";
import { FC, memo, useCallback } from "react";
import { GraphObject, GraphTypeMetadata } from "../common/Model";
import { createParameterNode } from "../common/value";

export const GraphFieldTree: FC<{
    readonly typeMetadata: GraphTypeMetadata,
    readonly obj: GraphObject,
    readonly value?: string,
    readonly onChange?: (value?: string) => void,
    readonly onLink?: (selectObjectId: string) => void
}> = memo(({typeMetadata, obj, value, onChange, onLink}) => {

    const onTreeSelect = useCallback((keys: any[]) => {
        if (onChange) {
            onChange(keys.length === 0 ? undefined : keys[0])
        }
    }, [onChange]);

    const onSuperClick = useCallback(() => {
        if (onLink && typeMetadata.superTypeName !== undefined) {
            onLink(`${typeMetadata.superTypeName}:${obj.id}`);
        }
    }, [typeMetadata, onLink, obj]);

    const onRuntimeTypeClick = useCallback(() => {
        if (onLink) {
            onLink(`${obj.runtimeTypeName}:${obj.id}`);
        }
    }, [onLink, obj]);

    return (
        <Card title="Selected object">
            <Tree 
            selectedKeys={value === undefined ? [] : [value]}
            onSelect={onTreeSelect}>
                {
                    <Tree.TreeNode key="staticType" title={
                        <div>
                            <LineOutlined/>
                            staticType: {typeMetadata.name}
                        </div>
                    }/>
                }
                {
                    obj.runtimeTypeName !== typeMetadata.name && <Tree.TreeNode key="runtimeType" title={
                        <div>
                            <LineOutlined/>
                            runtimeType: 
                            <Button type="link" onClick={onRuntimeTypeClick}>{obj.runtimeTypeName}</Button>
                        </div>
                    }/>
                }
                { 
                    typeMetadata.superTypeName &&
                    <Tree.TreeNode key="super" title={
                        <div>
                            <LineOutlined/>
                            super: 
                            <Button type="link" onClick={onSuperClick}>{typeMetadata.superTypeName}</Button>
                        </div>
                    }/>
                }
                {
                    typeMetadata.name !== "Query" && <Tree.TreeNode key="id" title={
                        <div>
                            <TagFilled/>id
                        </div>
                    }/>
                }
                {
                    obj.fields.map(field => {
                        if (typeMetadata.declaredFieldMap[field.name]?.isParamerized === true) {
                            return (
                                <Tree.TreeNode key={field.name} title={
                                    <div>
                                       <TagsOutlined/>{field.name} 
                                    </div>
                                }>
                                    {field.parameterizedValues?.map(pv =>
                                        <Tree.TreeNode key={`${field.name}:${pv.parameter}`} title={
                                            <div>
                                                <TagFilled/>
                                                {createParameterNode(pv.parameter)}
                                            </div>
                                        }/>
                                    )}
                                </Tree.TreeNode>
                            );
                        }
                        return (
                            <Tree.TreeNode key={`${field.name}:`} title={
                                <div>
                                    <TagFilled/>{field.name}
                                </div>
                            }/>
                        );
                    })
                }
            </Tree>
        </Card>
    );
});