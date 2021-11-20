import { FC, memo } from "react";
import { RESTNetworkBuilder } from "graphql-state";
import { newTypedConfiguration, Schema } from "../__generated_graphql_schema__";

export const App:FC = memo(() => {
    return <div style={{padding: "1rem"}}>
        <h1>Not implemented in current version, will come soon</h1>
        <h3>In the future</h3>
        <p>
            If the server is not implemented based on GraphQL, 
            the client will simulate a GraphQL implementation based on the REST request.
        </p>
        <p>
            In reality, many legacy projects are implemented on the server side using REST. 
            In the future, this framework will provide a "RESTNetwork" class to simulate GraphQL based on REST on the client side.
        </p>
    </div>;
});

function createStateManager() {
    return newTypedConfiguration()
        .network(
            new RESTNetworkBuilder<Schema>()
            .baseUrl("http://localhost:8081/rest")
            .rootAssociation(
                "findBookStores", variables => `/bookStores?name=${variables.name}`
            )
            .rootAssociation(
                "findBooks", variables => `/books?:name=${variables.name}`
            )
            .rootAssociation(
                "findAuthors", variables => `/authors?name=${variables.name}`
            )
            .association(
                "BookStore", "books", (ids, variables) => `/books?storeIds=${ids.join(",")}&name=${variables.name}`
            )
            .association(
                "Book", "store", ids => `/store?bookIds=${ids.join(",")}`
            )
            .association(
                "Book", "authors", (ids, variables) => `/authors?bookIds=${ids.join(",")}&name=${variables.name}`
            )
            .association(
                "Author", "books", (ids, variables) => `/books?authorIds=${ids.join(",")}&name=${variables.name}`
            )
            .build()
        )
        .buildStateManager()
    ;
}