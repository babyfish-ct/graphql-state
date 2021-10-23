import { makeStateFactory } from "graphql-state";

const { 
    createState, 
    createComputedState, 
    createParameterizedComputedState 
} = makeStateFactory();

export const xState = createState(
    "computed-demo-x", 
    1
);

/////////////////

const timesState = createParameterizedComputedState<number, { 
    readonly times: number 
}>(
    "computed-demo-times", 
    (ctx, variables) => {
    return ctx(xState) * variables.times
    }
);

export const totalState = createComputedState(
    "computed-demo-total", 
    ctx => {
        return ctx(timesState, { 
            variables: { times: 2}
        }) + 
        ctx(timesState, { 
            variables: { times: 3}
        });
    }
);

/////////////////

const factorialState = createParameterizedComputedState<number, {
    readonly value: number
}>(
    "computed-demo-factorial", 
    (ctx, variables) => {
        const { value } = variables;
        if (value <= 1) {
            return 1;
        }
        return value * ctx.self({
            variables: { value: value - 1 }
        })
    }
);

export const factorialXState = createComputedState(
    "computed-demo-factorialX",
    ctx => {
        return ctx(factorialState, {
            variables: { value: ctx(xState) }
        });
    }
);