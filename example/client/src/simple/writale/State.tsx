import { makeStateFactory } from "graphql-state";

const { createState } = makeStateFactory();

export const textState = createState(""); 