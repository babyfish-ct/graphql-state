import { Menu } from "antd";
import { FC, memo } from "react";

export const SiderView: FC = memo(() => {
    return (
        <Menu mode="inline" defaultOpenKeys={["simpleState", "graphqlState"]}>
            <Menu.SubMenu key="simpleState" title="Simple state">
                <Menu.Item>Hello world</Menu.Item>
            </Menu.SubMenu>
            <Menu.SubMenu key="graphqlState" title="GraphQL state">
                <Menu.Item>Local data</Menu.Item>
                <Menu.Item>GraphQL server</Menu.Item>
                <Menu.Item>Rest server</Menu.Item>
            </Menu.SubMenu>
        </Menu>
    );
});