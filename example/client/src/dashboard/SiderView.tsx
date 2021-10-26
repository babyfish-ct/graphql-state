import { Menu } from "antd";
import { FC, memo, useCallback, useMemo } from "react";
import useLocation from "wouter/use-location";

export const SiderView: FC = memo(() => {

    const [location, setLocation] = useLocation();

    const selectedKeys = useMemo<string[]>(() => {
        const lastSlashIndex = location.lastIndexOf('/');
        const key = lastSlashIndex === -1 ? location : location.substring(lastSlashIndex + 1);
        if (key === "") {
            return [];
        }
        return [key];
    }, [location]);

    const onMenuClick = useCallback((e: {readonly keyPath: readonly string[]}) => {
        const resvered = [...e.keyPath].reverse();
        setLocation(resvered.map(k => `/${k}`).join(""));
    }, [setLocation]);
    
    return (
        <Menu 
        mode="inline" 
        selectedKeys={selectedKeys}
        defaultOpenKeys={["simpleState", "graphState", "graphqlServer", "httpOpitmizator"]}
        onClick={onMenuClick}>
            <Menu.SubMenu key="simpleState" title="Simple state">
                <Menu.Item key="writableState">Writable State</Menu.Item>
                <Menu.Item key="computedState">Computed State</Menu.Item>
                <Menu.Item key="asyncState">Async State</Menu.Item>
                <Menu.Item key="effect">Effect</Menu.Item>
                <Menu.Item key="scope">Scope</Menu.Item>
            </Menu.SubMenu>
            <Menu.SubMenu key="graphState" title="Graph state">
                <Menu.Item key="localData">Local data</Menu.Item>
                <Menu.SubMenu key="graphqlServer" title="GraphQL server">
                    <Menu.Item key="unoptimized">Unoptimized</Menu.Item>
                    <Menu.Item key="optimized">Optimized</Menu.Item>
                </Menu.SubMenu>
                <Menu.Item key="restServer">Rest server</Menu.Item>
                <Menu.SubMenu key="httpOpitmizator" title="HTTP Opitmizator">
                    <Menu.Item>Fragments</Menu.Item>
                    <Menu.Item>Bigger shape</Menu.Item>
                    <Menu.Item>Pending queries</Menu.Item>
                </Menu.SubMenu>
            </Menu.SubMenu>
        </Menu>
    );
});