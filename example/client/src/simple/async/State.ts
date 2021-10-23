import { makeStateFactory } from "graphql-state";

const { 
    createState, 
    createAsyncState, 
    createParameterizedAsyncState 
} = makeStateFactory();

export const xState = createState(
    "async-demo-x", 
    1
);

/////////////////

const timesState = createParameterizedAsyncState<number, { 
    readonly times: number 
}>(
    "async-demo-times", 
    async (ctx, variables) => {
        await delay(3000);
        return ctx(xState) * variables.times
    }
);

export const totalState = createAsyncState(
    "async-demo-total", 
    async ctx => {
        const [first, second] = await Promise.all([
            ctx(timesState, { 
                variables: { times: 2}
            }),
            ctx(timesState, { 
                variables: { times: 3}
            })
        ]);
        return first + second;
    }
);

function delay(millis: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => { resolve() }, millis);
    })
}
