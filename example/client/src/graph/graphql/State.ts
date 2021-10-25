import { makeStateFactory } from "graphql-state";
import { ModelType } from "graphql-ts-client-api";
import { 
    query$, 
    bookStore$$, 
    bookConnection$, 
    bookEdge$, 
    book$$, 
    authorConnection$, 
    authorEdge$, 
    author$$ 
} from "./__generated/fetchers";
import { Schema } from "./__generated/TypedConfiguration";

const { createAsyncState } = makeStateFactory<Schema>();

export const bookStoreOptionListState = createAsyncState<
    ReadonlyArray<ModelType<typeof bookStore$$>>
>("graphql-demo-book-store-option-list", async ctx => {
    const data = await ctx.query(
        query$.findBookStores(
            bookStore$$,
        )
    );
    return data.findBookStores;
});

export const bookOptionListState = createAsyncState<
    ReadonlyArray<ModelType<typeof book$$>>
>("graphql-demo-book-option-list", async ctx => {
    const data = await ctx.query(
        query$.findBooks(
            bookConnection$.edges(
                bookEdge$.node(
                    book$$,
                )
            ),
            options => options.alias("conn")
        )
    );
    return data.conn.edges.map(edge => edge.node);
});

export const authorOptionListState = createAsyncState<
    ReadonlyArray<ModelType<typeof author$$>>
>("graphql-demo-author-option-list", async ctx => {
    const data = await ctx.query(
        query$.findAuthors(
            authorConnection$.edges(
                authorEdge$.node(
                    author$$,
                )
            ),
            options => options.alias("conn")
        )
    );
    return data.conn.edges.map(edge => edge.node);
});