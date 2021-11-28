import { newTypedConfiguration } from "../__generated_local_schema__";
import { initializeDefaultData } from "./InitializeDefaultData";

export function createStateManager() { 
    
    const stateManager = newTypedConfiguration()
        .bidirectionalAssociation("BookStore", "books", "store") // BookStore.books <---> Book.store
        .bidirectionalAssociation("Book", "authors", "books") // Book.authors <---> Author.books
        .buildStateManager()
    ;

    initializeDefaultData(stateManager);
    
    return stateManager;
}
