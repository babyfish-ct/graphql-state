/**
 * @author ChenTao
 * 
 * Server-side of example of 'graphql-ts-client'
 */
import "reflect-metadata";
import { buildSchemaSync } from "type-graphql";
import express from 'express';
import cors from "cors";
import { graphqlHTTP } from 'express-graphql';
import { useExpressServer } from 'routing-controllers';
import { BookStoreSerice } from "./graphql/bll/BookStoreService";
import { BookSerice } from "./graphql/bll/BookService";
import { AuthorService } from "./graphql/bll/AuthorService";
import { EntityService } from "./graphql/bll/EntityService";
import { BookStoreController } from './rest/bll/BookStoreController';
import { BookController } from "./rest/bll/BookController";
import { AuthorController } from "./rest/bll/AuthorController";
 
const schema = buildSchemaSync({
    resolvers: [
        EntityService,
        BookStoreSerice,
        BookSerice,
        AuthorService
    ]
});
 
const app = express()
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
;

useExpressServer(app, {
    routePrefix: "/rest",
    controllers: [
        BookStoreController,
        BookController,
        AuthorController
    ]
});

app
.get('/rest', (req, res) => {
    res.send(`<div style="font-size: 5rem">REST server for example of graphql-state</div>`);
})
.listen(8081, () => {
    console.log("\n\n\n");
    console.log("1. GraphQL server is started, please access http://localhost:8081/graphql");
    console.log("2. REST server is started, please access http://localhost:8081/rest");
});
 