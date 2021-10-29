import { FC, memo } from "react";

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