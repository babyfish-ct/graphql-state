import { TagFilled, TagsOutlined } from "@ant-design/icons";
import { Button, Card, Tree } from "antd";
import { FC, memo } from "react";
import { GraphObject, GraphTypeMetadata } from "../common/Model";

export const GraphFieldTree: FC<{
    readonly typeMetadata: GraphTypeMetadata,
    readonly obj: GraphObject
}> = memo(({typeMetadata, obj}) => {
    return (
        <Card title={typeMetadata.name}>
            <Tree>
                <Tree.TreeNode key="id" title={
                    <div>
                       <TagFilled/>id 
                    </div>
                }/>
                { typeMetadata.superTypeName &&
                    <Tree.TreeNode key="super" title={
                        <div>
                            <TagFilled/>
                            <Button type="link">super</Button>
                        </div>
                    }/>
                }
                {
                    obj.fields.map(field => {
                        if (typeMetadata.fieldMap[field.name]?.isParamerized === true) {
                            return (
                                <Tree.TreeNode key={field.name} title={
                                    <div>
                                       <TagsOutlined/>{field.name} 
                                    </div>
                                }>
                                    {field.parameterizedValues?.map(pv =>
                                        <Tree.TreeNode key={pv.parameter} title={
                                            <div>
                                                <TagFilled/>
                                                {pv.parameter === "" ? "default" : pv.parameter}
                                            </div>
                                        }/>
                                    )}
                                </Tree.TreeNode>
                            );
                        }
                        return (
                            <Tree.TreeNode key={field.name} title={
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