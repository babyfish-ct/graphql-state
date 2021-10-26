/**
 * @author ChenTao
 * 
 * Server-side of example of 'graphql-ts-client'
 */

import { buildSchemaSync, registerEnumType } from "type-graphql";
import express from 'express';
import cors from "cors";
import { graphqlHTTP } from 'express-graphql';
import { BookStoreSerice } from "./graphql/bll/BookStoreService";
import { BookSerice } from "./graphql/bll/BookService";
import { AuthorService } from "./graphql/bll/AuthorService";
 
const schema = buildSchemaSync({
    resolvers: [
        BookStoreSerice,
        BookSerice,
        AuthorService
    ]
});
 
express()
    .use(cors())
    .use(
        '/graphql', 
        graphqlHTTP({
            schema,
            graphiql: true,
            customFormatErrorFn: err => {
                console.log("Exception raised!", err);
                return err;
            }
        })
    )
    .listen(8081, () => {
        console.log("\n\n\nGraphQL server is started, please access http://localhost:8081/graphql");
    });
 