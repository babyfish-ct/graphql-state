import { makeStateFactory } from "graphql-state"

const { createState } = makeStateFactory();

export const xState = createState("scope-demo-x", 0);

export const yState = createState("scope-demo-y", 0, {
    scope: "any-scope"
});