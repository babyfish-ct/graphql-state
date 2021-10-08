import { Layout } from "antd";
import { FC, memo } from "react";
import { SiderView } from "./SiderView";

export const Dashboard: FC = memo(() => {
    return (
        <Layout>
            <Layout.Sider width={200}>
                <SiderView/>
            </Layout.Sider>
        </Layout>
    );
});