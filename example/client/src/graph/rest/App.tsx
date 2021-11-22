import { Card, Space, Tabs } from "antd";
import { StateManagerProvider } from "graphql-state";
import { FC, memo } from "react";
import { createStateManager } from "./Environment";
import { BookStoreList } from "./store/BookStoreList";

export const App:FC = memo(() => {
    const stateManager = createStateManager();
    return (
        <StateManagerProvider stateManager={stateManager}>
            <Card>
                <Space direction="vertical" style={{width: "100%"}}></Space>
                <Tabs>
                    <Tabs.TabPane tabKey="bookStores" tab="BookStore List">
                        <BookStoreList/>
                    </Tabs.TabPane>
                </Tabs>
            </Card>
        </StateManagerProvider>
    );
});
