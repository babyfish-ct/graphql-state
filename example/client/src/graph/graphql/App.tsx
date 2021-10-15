import { FC, memo, Suspense } from "react";
import { StateManagerProvider } from "graphql-state";
import { Card, Spin, Tabs } from "antd";
import { BookStoreList } from "./store/BookStoreList";
import { stateManager } from "./Environment";

export const App: FC = memo(() => {
    return (
        <StateManagerProvider stateManager={stateManager}>
            <Card>
                <Tabs>
                    <Tabs.TabPane tab="BookStore" key="bookStore">
                        <Suspense fallback={<><Spin/>Loading book store list...</>}>
                            <BookStoreList/>
                        </Suspense>
                        <Suspense fallback={<><Spin/>Loading book store list...</>}>
                            <BookStoreList/>
                        </Suspense>
                        <Suspense fallback={<><Spin/>Loading book store list...</>}>
                            <BookStoreList/>
                        </Suspense>
                    </Tabs.TabPane>
                </Tabs>
            </Card>
        </StateManagerProvider>
    );
});