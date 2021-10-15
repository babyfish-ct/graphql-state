import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { Card, Tabs } from "antd";
import { BookStoreList } from "./store/BookStoreList";
import { stateManager } from "./Environment";

export const App: FC = memo(() => {
    return (
        <StateManagerProvider stateManager={stateManager}>
            <Card>
                <Tabs>
                    <Tabs.TabPane tab="BookStore" key="bookStore">
                        <BookStoreList/>
                    </Tabs.TabPane>
                </Tabs>
            </Card>
        </StateManagerProvider>
    );
});