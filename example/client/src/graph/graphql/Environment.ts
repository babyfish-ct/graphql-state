import { FlatRow, ParameterizedAssociationProperties, StateManager } from "graphql-state";
import { PositionType, ConnectionRange } from "graphql-state";
import { Schema } from "../__generated_graphql_schema__";
import { newTypedConfiguration } from "../__generated_graphql_schema__";
import { publishEntityLog } from "./log/EntityLog";
import { createGraphQLNetwork } from "../common/Networks";

function createNameFilterAssociationProperties<
    TFlatType extends { readonly name: string }, 
    TVariables extends { readonly name?: string }
>(): ParameterizedAssociationProperties<TFlatType, TVariables> {
    
    return {

        // Is the object allowed to be inserted into association?
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
            if (row.has("name")) {
                const rowName = row.get("name");
                for (let i = 0; i < rows.length; i++) {
                    if (rows[i].has("name") && rows[i].get("name") > rowName) {
                        return i;
                    }
                }
            }
            return "end";
        },

        // Does this association depend on some fields of target object?
        // If some dependencies fields of some objects are changed, the current association be evict
        // from cache and affected UI will reload the data from server.
        // 1. If an object is already in this association but it does not match the filter after change,
        //    the association will not contain it after automatic refetch
        // 2. If an object is not in the association but it match the filter after change,
        //    this association will not contain it after automatic refetch
        dependencies: (variables?: TVariables): ReadonlyArray<keyof TFlatType> | undefined => {
            // No filter, depends on nothing
            // If the name of filter is specified, depends on "name"
            return variables?.name === undefined ? [] : ["name"];
        },

        range: (range: ConnectionRange, delta: number, direction: "forward" | "backward"): void => {
            range.totalCount += delta;
            if (direction === "forward") {
                range.endCursor = indexToCursor(cursorToIndex(range.endCursor) + delta);
            }
        }
    }
};

export function createStateManager(withCustomerOptimization: boolean): StateManager<Schema> {

    const cfg = newTypedConfiguration()

        .bidirectionalAssociation("BookStore", "books", "store")
        .bidirectionalAssociation("Book", "authors", "books")

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

function indexToCursor(index: number): string {
    return Buffer.from(index.toString(), 'utf-8').toString('base64');
}

function cursorToIndex(cursor: string): number {
    return parseInt(Buffer.from(cursor, 'base64').toString('utf-8'));
}