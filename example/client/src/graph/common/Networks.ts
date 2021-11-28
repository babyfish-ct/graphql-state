import { GraphQLNetwork } from "graphql-state";
import { publishGraphQLRequestLog, publishResponseLog } from "./HttpLog";

export function createGraphQLNetwork(): GraphQLNetwork {
    return new GraphQLNetwork(async(body, variables) => {
        const id = publishGraphQLRequestLog(body, variables);
        const response = await fetch('http://localhost:8081/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: body,
                variables,
            }),
        }); 
        const json = await response.json();
        publishResponseLog(id, json);
        return json;
    });
}