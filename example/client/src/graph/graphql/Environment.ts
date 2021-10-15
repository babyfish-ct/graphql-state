import { GraphQLNetwork } from "graphql-state/dist/meta/Configuration";
import { newTypedConfiguration } from "./__generated";

export const stateManager =
    newTypedConfiguration()
    .bidirectionalAssociation("BookStore", "books", "store")
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