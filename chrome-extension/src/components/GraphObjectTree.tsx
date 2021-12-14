import { FC, memo, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Tooltip, Tree } from "antd";
import { GraphSnapshot } from "../common/Model";
import { FileOutlined, FolderOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";

export const GraphObjectTree: FC<{
    readonly snapshot: GraphSnapshot,
    readonly value?: string,
    readonly onChange?: (value?: string) => void
}> = memo(({snapshot, value, onChange}) => {

    const allKeys = useMemo<string[]>(() => {
        return snapshot.types.map(type => type.name);
    }, [snapshot]);

    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

    const onExpandAllClick = useCallback(() => {
        setExpandedKeys(allKeys);
    }, [allKeys]);

    const onCollapseAllClick = useCallback(() => {
        setExpandedKeys([]);
    }, []);

    const onExpand = useCallback((keys: any[]) => {
        setExpandedKeys(keys);
    }, []);

    const onTreeSelect = useCallback((keys: any[]) => {
        if (onChange !== undefined) {
            const key = keys.length === 0 ? undefined : keys[0] as string;
            onChange(key);
        }
    }, [onChange]);

    useEffect(() => {
        if (value !== undefined) {
            const colonIndex = value.indexOf(":");
            if (colonIndex !== undefined) {
                const typeName = value.substring(0, colonIndex);
                setExpandedKeys(oldKeys => {
                    if (oldKeys.indexOf(typeName) === -1) {
                        return [...oldKeys, typeName];
                    }
                    return oldKeys;
                })
            }
        }
    }, [value]);

    return (
        <Card title="Graph objects" extra={
            <div>
                <Tooltip title="Expand all">
                    <Button type="link" onClick={onExpandAllClick}><PlusOutlined/></Button>
                </Tooltip>
                <Tooltip title="Collapse all">
                    <Button type="link" onClick={onCollapseAllClick}><MinusOutlined/></Button>
                </Tooltip>
            </div>
        }>
            <Tree 
            expandedKeys={expandedKeys} 
            onExpand={onExpand} 
            selectedKeys={value === undefined ? [] : [value]}
            onSelect={onTreeSelect}>
                {
                    snapshot.query && 
                    <Tree.TreeNode 
                    key={`Query:${snapshot.query.id}`}
                    title={
                        <div><FileOutlined/>Query</div>
                    }/>
                }
                {
                    snapshot.types.map(type => 
                        <Tree.TreeNode
                        key={`${type.name}`}
                        title={
                            <div><FolderOutlined/>{type.name}</div>
                        }>
                            {
                                type.objects.map(obj => 
                                    <Tree.TreeNode
                                    key={`${type.name}:${obj.id}`}
                                    title={
                                        <div><FileOutlined/>{obj.id}</div>
                                    }/>
                                )
                            }
                        </Tree.TreeNode>
                    )
                }
            </Tree>
        </Card>
    );
});