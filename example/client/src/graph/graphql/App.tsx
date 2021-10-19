import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { Card, Tabs } from "antd";
import { BookStoreList } from "./store/BookStoreList";
import { stateManager } from "./Environment";
import { AuthorList } from "./author/AuthorList";
import { BookList } from "./book/BookList";

export const App: FC = memo(() => {
    return (
        <StateManagerProvider stateManager={stateManager}>
            <Card>
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
            </Card>
        </StateManagerProvider>
    );
});