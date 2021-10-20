import { GraphQLNetwork, ScalarRow, ParameterizedAssociationProperties } from "graphql-state";
import { newTypedConfiguration } from "./__generated";

function createNameFilterAssociationProperties<
    TScalarType extends { readonly name: string }, 
    TVariables extends { readonly name?: string }
>(): ParameterizedAssociationProperties<TScalarType, TVariables> {
    
    return {

        // Is the object allowed to be inserted into association?
        contains: (
            row: ScalarRow<TScalarType>, 
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

        // Does this association depend on some scalar fields of target object?
        // If some dependencies fields of some objects are changed, the current association be evict
        // from cache and affected UI will reload the data from server.
        // 1. If an object is already in this association but it does not match the filter after change,
        //    the association will not contain it after automatic refetch
        // 2. If an object is not in the association but it match the filter after change,
        //    this association will not contain it after automatic refetch
        dependencies: (variables?: TVariables): ReadonlyArray<keyof TScalarType> | undefined => {
            // No filter, depends on nothing
            // If the name of filter is specified, depends on "name"
            return variables?.name === undefined ? [] : ["name"];
        }
    }
};

export const stateManager =
    newTypedConfiguration()

    .bidirectionalAssociation("BookStore", "books", "store")
    .bidirectionalAssociation("Book", "authors", "books")
    
    .rootAssociationProperties("findBooksStores", createNameFilterAssociationProperties())
    .rootAssociationProperties("findBooks", createNameFilterAssociationProperties())
    .rootAssociationProperties("findAuthors", createNameFilterAssociationProperties())
    .associationProperties("BookStore", "books", createNameFilterAssociationProperties())
    .associationProperties("Book", "authors", createNameFilterAssociationProperties())
    .associationProperties("Author", "books", createNameFilterAssociationProperties())

    .network(new GraphQLNetwork(async(body, variables) => {
        console.log(`fetching query ${body} with ${JSON.stringify(variables)}`);
        const response = await fetch('http://localhost:8080/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: body,
                variables,
            }),
        }); 
        return await response.json();
    }))
    .buildStateManager()
;

(window as any).graphqlStateManager = stateManager;