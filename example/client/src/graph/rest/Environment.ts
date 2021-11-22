import { RESTNetworkBuilder } from "graphql-state";
import { newTypedConfiguration, Schema } from "../__generated_rest_schema__";

export function createStateManager() {
    return newTypedConfiguration()
        .networkBuilder(
            new RESTNetworkBuilder<Schema>(
                "http://localhost:8081/rest",
                async url => {
                    const response = await fetch(url, {method: 'GET'}); 
                    return await response.json();
                }
            )
            .defaultBatchSize(256)
            .defaultCollectionBatchSize(16)
            .rootAssociation(
                "findBookStores", (url, variables) => url.path("/findBookStores").args(variables)
            )
            .rootAssociation(
                "findBooks", (url, variables) => url.path("/findBooks").args(variables)
            )
            .rootAssociation(
                "findAuthors", (url, variables) => url.path("/findAuthors").args(variables)
            )
            .association(
                "BookStore", "books", {
                    batchLoader: (url, ids, variables) => url
                        .path("/findBooksByStores")
                        .arg("storeIds", ids.join(","))
                        .args(variables),
                    groupBy: "storeId"
                }
            )
            .association(
                "Book", "store", {
                    batchLoader: (url, ids) => url
                        .path("findStoresByBooks")
                        .arg("bookIds", ids.join(","))
                }
            )
            .association(
                "Book", "authors", {
                    batchLoader: (url, ids, variables) => url
                        .path("/findAuthorsByBooks")
                        .arg("bookIds", ids.join(","))
                        .args(variables)
                }
            )
            .association(
                "Author", "books", {
                    batchLoader: (url, ids, variables) => url
                        .path("/findBooksByAuthors")
                        .arg("authorIds", ids.join(","))
                        .args(variables)
                }
            )
        )
        .buildStateManager()
    ;
}