import { FlatRow, ParameterizedAssociationProperties, StateManager } from "graphql-state";
import { PositionType, ConnectionRange } from "graphql-state";
import { Schema } from "../__generated_graphql_schema__";
import { newTypedConfiguration } from "../__generated_graphql_schema__";
import { publishEntityLog } from "./log/EntityLog";
import { createGraphQLNetwork } from "../common/Networks";

export function createStateManager(withCustomerOptimization: boolean): StateManager<Schema> {

    const cfg = newTypedConfiguration()

        .bidirectionalAssociation("Book", "store", "books") // BookStore.books <----> Book.store
        .bidirectionalAssociation("Book", "authors", "books") //Book.authors <----> Author.books

        .network(createGraphQLNetwork())
    ;

    if (withCustomerOptimization) {
        cfg
        .rootAssociationProperties("findBookStores", createNameFilterAssociationProperties())
        .rootAssociationProperties("findBooks", createNameFilterAssociationProperties())
        .rootAssociationProperties("findAuthors", createNameFilterAssociationProperties())
        .associationProperties("BookStore", "books", createNameFilterAssociationProperties())
        .associationProperties("Book", "authors", createNameFilterAssociationProperties())
        .associationProperties("Author", "books", createNameFilterAssociationProperties())
    }

    const stateManager = cfg.buildStateManager();

    stateManager.addEntityEvictListener(e => { publishEntityLog(e) });
    stateManager.addEntityChangeListener(e => { publishEntityLog(e) });

    return stateManager;
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