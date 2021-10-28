import { makeStateFactory } from "graphql-state";

const { createState } = makeStateFactory();

export const bookNameState = createState(
    "http-peak-clipping-demo-book-name", 
    ""
);