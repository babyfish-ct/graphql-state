import { Card, Space, Tabs } from "antd";
import { StateManagerProvider } from "graphql-state";
import { FC, memo, useCallback } from "react";
import { LogPanel } from "../common/LogPanel";
import { AuthorList } from "./author/AuthorList";
import { BookList } from "./book/BookList";
import { createStateManager } from "./Environment";
import { BookStoreList } from "./store/BookStoreList";

export const App:FC = memo(() => {
    
    const stateManager = createStateManager();

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
        <StateManagerProvider stateManager={stateManager} releasePolicy={releasePolicy}>
            <Card>
                <Space direction="vertical" style={{width: "100%"}}></Space>
                <Tabs>
                    <Tabs.TabPane key="bookStores" tab="BookStore List">
                        <BookStoreList/>
                    </Tabs.TabPane>
                    <Tabs.TabPane key="books" tab="Book List">
                        <BookList/>
                    </Tabs.TabPane>
                    <Tabs.TabPane key="authors" tab="Author List">
                        <AuthorList/>
                    </Tabs.TabPane>
                </Tabs>
                <LogPanel/>
            </Card>
        </StateManagerProvider>
    );
});
