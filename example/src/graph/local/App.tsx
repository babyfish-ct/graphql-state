import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { newTypedConfiguration } from "../../__generated";
import { BookList } from "./book/BookList";
import { BookStoreList } from "./store/BookStoreList";
import { AuthorList } from "./author/AuthorList";
import { initializeDefaultData } from "./InitializeDefaultData";

export const stateManager = 
    newTypedConfiguration()
    .bidirectionalAssociation("BookStore", "books", "store")
    .bidirectionalAssociation("Book", "authors", "books")
    .buildStateManager()
;

initializeDefaultData(stateManager);

(window as any).stateManager = stateManager;

export const App: FC = memo(() => {
    return (
        <StateManagerProvider stateManager={stateManager}>
            <BookStoreList/>
            <BookList/>
            <AuthorList/>
        </StateManagerProvider>
    );
});