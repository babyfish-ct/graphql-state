import { newTypedConfiguration } from "./__generated";
import { initializeDefaultData } from "./InitializeDefaultData";

export const stateManager = 
    newTypedConfiguration()
    .bidirectionalAssociation("BookStore", "books", "store")
    .bidirectionalAssociation("Book", "authors", "books")
    .buildStateManager()
;

initializeDefaultData(stateManager);