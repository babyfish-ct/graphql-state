import { css } from "@emotion/css";
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
        defaultOpenKeys={["simpleState", "graphState", "graphqlServer", "httpOpitimizator"]}
        onClick={onMenuClick}>
            <Menu.SubMenu key="simpleState" title="Simple state">
                <Menu.Item key="writableState">Writable State</Menu.Item>
                <Menu.Item key="computedState">Computed State</Menu.Item>
                <Menu.Item key="asyncState">Async State</Menu.Item>
                <Menu.Item key="effect">Effect</Menu.Item>
                <Menu.Item key="scope">Scope</Menu.Item>
            </Menu.SubMenu>
            <Menu.SubMenu key="graphState" title="Graph state">
                <Menu.Item key="localData" className={IMPORTANNT_CSS}>Local data</Menu.Item>
                <Menu.SubMenu key="graphqlServer" title="GraphQL server">
                    <Menu.Item key="unoptimized" className={IMPORTANNT_CSS}>Unoptimized</Menu.Item>
                    <Menu.Item key="optimized" className={IMPORTANNT_CSS}>Optimized</Menu.Item>
                </Menu.SubMenu>
                <Menu.Item key="restServer" className={IMPORTANNT_CSS}>REST server</Menu.Item>
                <Menu.SubMenu key="httpOpitimizator" title="HTTP Opitmizator">
                    <Menu.Item key="peakClipping">Peak clipping</Menu.Item>
                    <Menu.Item key="objectBaseOnId">Objects</Menu.Item>
                    <Menu.Item key="mergeDifferentShapes">Shapes</Menu.Item>
                    <Menu.Item key="reusePendingQueries">Pending queries</Menu.Item>
                </Menu.SubMenu>
            </Menu.SubMenu>
        </Menu>
    );
});

const IMPORTANNT_CSS = css({
    fontWeight: "bold",
    color: "darkblue"
});