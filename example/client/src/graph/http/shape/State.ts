import { makeStateFactory } from "graphql-state"

const { createState } = makeStateFactory();

export const bookNameState = createState<string | undefined>("http-shape-demo-book-name", undefined); 