import { makeStateFactory } from "graphql-state"

const { createState } = makeStateFactory();

export const bookNameState = createState("http-pending-demo-book-name", "");

export const DELAY_MILLIS = 4000;