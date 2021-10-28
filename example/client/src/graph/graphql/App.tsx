import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { Card, Space, Tabs } from "antd";
import { BookStoreList } from "./store/BookStoreList";
import { createStateManager } from "./Environment";
import { AuthorList } from "./author/AuthorList";
import { BookList } from "./book/BookList";
import { LogPanel } from "./log/LogPanel";

export const App: FC<{
    readonly withCustomerOptimization: boolean
}> = memo(({withCustomerOptimization}) => {

    const stateManager = createStateManager(withCustomerOptimization);

    return (
        <StateManagerProvider stateManager={stateManager}>
            <Card>
                <Space direction="vertical" style={{width: "100%"}}>
                    <Tabs>
                        <Tabs.TabPane tab="Book Store Management" key="bookStores">
                            <BookStoreList/>
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Book  Management" key="books">
                            <BookList/>
                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Author  Management" key="authors">
                            <AuthorList/>
                        </Tabs.TabPane>
                    </Tabs>
                    <LogPanel/>
                </Space>
            </Card>
        </StateManagerProvider>
    );
});