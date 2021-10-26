import { newTypedConfiguration } from "../__generated_local_schema__";
import { initializeDefaultData } from "./InitializeDefaultData";

export function createStateManager() { 
    
    const stateManager = newTypedConfiguration()
        .bidirectionalAssociation("BookStore", "books", "store")
        .bidirectionalAssociation("Book", "authors", "books")
        .buildStateManager()
    ;

    initializeDefaultData(stateManager);
    
    return stateManager;
}
