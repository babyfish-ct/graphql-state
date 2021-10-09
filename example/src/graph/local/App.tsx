import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { newTypedConfiguration } from "../../__generated";
import { BookList } from "./BookList";

export const stateManager = 
    newTypedConfiguration()
    .bidirectionalAssociation("BookStore", "books", "store")
    .bidirectionalAssociation("Book", "authors", "books")
    .buildStateManager();

export const App: FC = memo(() => {
    return (
        <StateManagerProvider stateManager={stateManager}>
            <BookList/>
        </StateManagerProvider>
    );
});