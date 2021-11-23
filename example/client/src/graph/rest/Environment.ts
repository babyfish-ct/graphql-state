import { ConnectionRange, FlatRow, ParameterizedAssociationProperties, PositionType, RESTNetworkBuilder } from "graphql-state";
import { publishEntityLog } from "../common/EntityLog";
import { publishResponseLog, publishRESTRequestLog } from "../common/HttpLog";
import { newTypedConfiguration, Schema } from "../__generated_rest_schema__";
import { BASE_URL } from "./Contants";

export function createStateManager() {
    const stateManager = newTypedConfiguration()

        // Map REST to GraphQL
        .networkBuilder(createRESTNetworkBuilder())
        
        // Assocaition optimizers
        .rootAssociationProperties("findBookStores", createNameFilterAssociationProperties())
        .rootAssociationProperties("findBooks", createNameFilterAssociationProperties())
        .rootAssociationProperties("findAuthors", createNameFilterAssociationProperties())
        .associationProperties("BookStore", "books", createNameFilterAssociationProperties())
        .associationProperties("Book", "authors", createNameFilterAssociationProperties())
        .associationProperties("Author", "books", createNameFilterAssociationProperties())

        // Bidirection associations
        .bidirectionalAssociation("BookStore", "books", "store") // BookStore.books <---> Book.store
        .bidirectionalAssociation("Book", "authors", "books") // Book.authors <---> Author.books

        .buildStateManager()
    ;

    stateManager.addEntityEvictListener(e => { publishEntityLog(e) });
    stateManager.addEntityChangeListener(e => { publishEntityLog(e) });

    return stateManager;
}

function createRESTNetworkBuilder(): RESTNetworkBuilder<Schema> {
    return new RESTNetworkBuilder<Schema>(
        BASE_URL,
        async url => {
            const id = publishRESTRequestLog(url);
            const response = await fetch(url); 
            const data = await response.json();
            publishResponseLog(id, data);
            return data;
        }
    )
    .rootAssociation(
        "findBookStores", (url, variables) => url.path("/bookStores").args(variables)
    )
    .rootAssociation(
        "findBooks", (url, variables) => url.path("/books").args(variables)
    )
    .rootAssociation(
        "findAuthors", (url, variables) => url.path("/authors").args(variables)
    )
    .association(
        "BookStore", "books", {
            batchLoader: (url, ids, variables) => url
                .path("/booksOfStores")
                .arg("storeIds", ids.join(","))
                .args(variables),
            groupBy: "storeId"
        }
    )
    .association(
        "Book", "store", {
            batchLoader: (url, ids) => url
                .path("bookStoresOfBooks")
                .arg("bookIds", ids.join(","))
        }
    )
    .association(
        "Book", "authors", {
            batchLoader: (url, ids, variables) => url
                .path("/authorsOfBooks")
                .arg("bookIds", ids.join(","))
                .args(variables)
        }
    )
    .association(
        "Author", "books", {
            batchLoader: (url, ids, variables) => url
                .path("/booksOfAuthors")
                .arg("authorIds", ids.join(","))
                .args(variables)
        }
    );
}

function createNameFilterAssociationProperties<
    TFlatType extends { readonly name: string }, 
    TVariables extends { readonly name?: string }
>(): ParameterizedAssociationProperties<TFlatType, TVariables> {
    
    return {

        contains: (
            row: FlatRow<TFlatType>, 
            variables?: TVariables
        ): boolean | undefined => {
            if (variables?.name === undefined) {
                // no filter, always allow
                return true; 
            }
            if (row.has("name")) {
                // If "name" field of added object is cached, check whether the name field match the filter
                return row.get("name").toLowerCase().indexOf(variables.name.toLowerCase()) !== -1;
            }
            // Otherwise, return undefined, that means the result is unknown.
            // This association will be evicted from cache and the affected UI will reload the data from server
            return undefined; 
        },

        position(
            row: FlatRow<TFlatType>, 
            rows: ReadonlyArray<FlatRow<TFlatType>>
        ): PositionType | undefined {
            if (row.has("name")) { // if name of new row is cached
                const rowName = row.get("name");
                for (let i = 0; i < rows.length; i++) {
                    if (!rows[i].has("name")) { // if name of existing row is not cached
                        return undefined;
                    }
                    if (rows[i].get("name") > rowName) {
                        return i;
                    }
                }
                return "end";
            }
            return undefined;
        },

        dependencies: (_?: TVariables): ReadonlyArray<keyof TFlatType> | undefined => {
            // "_" is used here, an array contains "name" is always returned
            // because "name" is not only used to filter rows, but also used to sort rows.
            //
            // if "name" is only used to filter rows, please implement it like this
            // 
            // return _.name !== undefined ? ["name"] : [];
            return ["name"];
        },

        range: (range: ConnectionRange, delta: number, direction: "forward" | "backward"): void => {
            range.totalCount += delta;
            if (direction === "forward") {
                range.endCursor = indexToCursor(cursorToIndex(range.endCursor) + delta);
            }
        }
    }
};

function indexToCursor(index: number): string {
    return Buffer.from(index.toString(), 'utf-8').toString('base64');
}

function cursorToIndex(cursor: string): number {
    return parseInt(Buffer.from(cursor, 'base64').toString('utf-8'));
}