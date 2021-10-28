import { makeStateFactory } from "graphql-state";
import { ModelType } from "graphql-ts-client-api";
import { 
    query$, 
    bookStore$, 
    bookConnection$, 
    bookEdge$, 
    book$, 
    authorConnection$, 
    authorEdge$, 
    author$
} from "../__generated_graphql_schema__/fetchers";
import { Schema } from "../__generated_graphql_schema__";

const { createAsyncState } = makeStateFactory<Schema>();


/**
 * These three simple lists are used by <Select/>(DropDownList)
 * 
 * In this example, they are not used by "useQuery" hook directly 
 * in the selector componenets, but they are wrapped as AsyncState objects.
 *
 * The reason for this is that this framework will provide a "preload" 
 * function for AsyncState IN NEXT VERSION.
 */


export const bookStoreOptionListState = createAsyncState<
    ReadonlyArray<ModelType<typeof bookStore$.id.name>>
>("graphql-demo-book-store-option-list", async ctx => {
    const data = await ctx.query(
        query$.findBookStores(
            bookStore$.id.name,
        )
    );
    return data.findBookStores;
});

export const bookOptionListState = createAsyncState<
    ReadonlyArray<ModelType<typeof book$.id.name>>
>("graphql-demo-book-option-list", async ctx => {
    const data = await ctx.query(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$.id.name,
                )
            ),
            options => options.alias("conn")
        )
    );
    return data.conn.edges.map(edge => edge.node);
});

export const authorOptionListState = createAsyncState<
    ReadonlyArray<ModelType<typeof author$.id.name>>
>("graphql-demo-author-option-list", async ctx => {
    const data = await ctx.query(
        query$.findAuthors(
            authorConnection$.edges(
                authorEdge$.node(
                    author$.id.name,
                )
            ),
            options => options.alias("conn")
        )
    );
    return data.conn.edges.map(edge => edge.node);
});