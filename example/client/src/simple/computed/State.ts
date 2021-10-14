import { makeStateFactory } from "graphql-state";

const { 
    createState, 
    createComputedState, 
    createParameterizedComputedState 
} = makeStateFactory();

export const xState = createState(1);

/////////////////

const timesState = createParameterizedComputedState<number, { 
    readonly times: number 
}>((ctx, variables) => {
    return ctx(xState) * variables.times
});

export const totalState = createComputedState(ctx => {
    return ctx(timesState, { 
        variables: { times: 2}
    }) + 
    ctx(timesState, { 
        variables: { times: 3}
    });
});

/////////////////

const factorialState = createParameterizedComputedState<number, {
    readonly value: number
}>((ctx, variables) => {
    const { value } = variables;
    if (value <= 1) {
        return 1;
    }
    return value * ctx.self({
        variables: { value: value - 1 }
    })
});

export const factorialXState = createComputedState(ctx => {
    return ctx(factorialState, {
        variables: { value: ctx(xState) }
    });
});