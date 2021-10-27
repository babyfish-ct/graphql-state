import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { BookList } from "./book/BookList";
import { BookStoreList } from "./store/BookStoreList";
import { AuthorList } from "./author/AuthorList";
import { createStateManager } from "./Environment";

export const App: FC = memo(() => {
    
    const stateManager = createStateManager();

    (window as any).localStateManager = stateManager;

    return (
        <StateManagerProvider stateManager={stateManager}>
            <BookStoreList/>
            <BookList/>
            <AuthorList/>
        </StateManagerProvider>
    );
});