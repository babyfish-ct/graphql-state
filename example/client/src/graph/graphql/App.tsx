import { FC, memo, useCallback } from "react";
import { StateManagerProvider } from "graphql-state";
import { Card, Col, Row, Space, Tabs } from "antd";
import { BookStoreList } from "./store/BookStoreList";
import { createStateManager } from "./Environment";
import { AuthorList } from "./author/AuthorList";
import { BookList } from "./book/BookList";
import { LogPanel } from "../common/LogPanel";

export const App: FC<{
    readonly withCustomerOptimization: boolean
}> = memo(({withCustomerOptimization}) => {

    const stateManager = createStateManager(withCustomerOptimization);

    const releasePolicy = useCallback((aliveTime: number) => {
        if (aliveTime < 1000) {
            return 0;
        }
        /* 
         * In actual projects, the data discarded by the UI may be released by the 
         * garbage collection system in a relatively short period of time. 
         * 
         * In this example, in order to achieve the demonstration effect of
         * "https://github.com/babyfish-ct/graphql-state/blob/master/optimized-mutation.gif", 
         * the garbage release strategy is deliberately adjusted so that all 
         * query result can exist in the cache for a relatively long time.
         */
        return 60_000;
    }, []);

    return (
        <StateManagerProvider 
        stateManager={stateManager}
        releasePolicy={releasePolicy}>
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