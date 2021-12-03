import { Button, Card, Tooltip, Tree } from "antd";
import { AppstoreOutlined, MinusOutlined, PlusOutlined, TagFilled, TagsOutlined } from "@ant-design/icons";
import { FC, memo, ReactNode, useCallback, useMemo, useState } from "react";
import { SimpleState, SimpleStateScope } from "../common/Model";
import { childPathOf, visitScope } from "../common/util";

export const SimpleStateTree: FC<{
    readonly scope: SimpleStateScope
}> = memo(({scope}) => {

    const allKeys = useMemo<string[]>(() => {
        const keys: string[] = [];
        visitScope(scope, {
            scope: path => keys.push(path),
            state: (path, state) => { 
                if (state.parameterizedValues !== undefined) {
                    keys.push(path);
                }
            }
        });
        return keys;
    }, [scope]);

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

    return (
        <Card title="Simple states" extra={
            <div>
                <Tooltip title="Expand all">
                    <Button type="link" onClick={onExpandAllClick}><PlusOutlined/></Button>
                </Tooltip>
                <Tooltip title="Collapse all">
                    <Button type="link" onClick={onCollapseAllClick}><MinusOutlined/></Button>
                </Tooltip>
            </div>
        }>
            <Tree expandedKeys={expandedKeys} onExpand={onExpand}>
                {createScopeNode(scope, '/')}
            </Tree>
        </Card>
    );
});

function createScopeNode(scope: SimpleStateScope, path: string): ReactNode {
    const childPath = childPathOf(path, scope.name, true);
    return (
        <Tree.TreeNode 
        key={childPath} 
        title={
            <div><AppstoreOutlined/>{scope.name === "" ? "globalScope" : scope.name}</div>
        }>
            { scope.states.map(state => createStateNode(state, childPath)) }
            { scope.scopes.map(scope => createScopeNode(scope, childPath)) }
        </Tree.TreeNode>
    );
}

function createStateNode(state: SimpleState, path: string): ReactNode {
    const childPath = childPathOf(path, state.name, false); 
    return (
        <Tree.TreeNode 
        key={childPath} 
        title={
            <div>
                {
                    state.parameterizedValues !== undefined ?
                    <TagsOutlined/> :
                    <TagFilled/>
                }
                {state.name}
            </div>
        }>
            {
                state.parameterizedValues?.map(parameterizedValue => {
                    const parameter = parameterizedValue.parameter;
                    return (
                        <Tree.TreeNode 
                        key={`${childPath}:${parameter}`}
                        title={
                            <div><TagFilled/>{parameter !== "" ? parameter : "default"}</div>
                        }/>
                    );   
                })
            }
        </Tree.TreeNode>
    );
}
