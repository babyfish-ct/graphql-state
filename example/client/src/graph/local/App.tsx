import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { BookList } from "./book/BookList";
import { BookStoreList } from "./store/BookStoreList";
import { AuthorList } from "./author/AuthorList";
import { createStateManager } from "./Environment";

export const App: FC = memo(() => {
    
    const stateManager = createStateManager();

    return (
        <StateManagerProvider stateManager={stateManager}>
            <div style={{padding: "1rem"}}>
                This is simplest demo about graph state.
                <ul>
                    <li>All the objects and associations are cached</li>
                    <li>There are no assocaitions with filter variables</li>
                </ul>
            </div>
            <BookStoreList/>
            <BookList/>
            <AuthorList/>
        </StateManagerProvider>
    );
});