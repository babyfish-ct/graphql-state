import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { BookList } from "./book/BookList";
import { BookStoreList } from "./store/BookStoreList";
import { AuthorList } from "./author/AuthorList";
import { stateManager } from "./Environment";


export const App: FC = memo(() => {
    return (
        <StateManagerProvider stateManager={stateManager}>
            <BookStoreList/>
            <BookList/>
            <AuthorList/>
        </StateManagerProvider>
    );
});