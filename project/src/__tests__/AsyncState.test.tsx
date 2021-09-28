import { FC, memo, useCallback } from "react";
import { screen, cleanup, fireEvent, render, waitFor, act, waitForElementToBeRemoved } from '@testing-library/react';
import { StateManagerProvider, makeStateFactory, useStateValue, useStateAccessor } from '..';
import { useStateAsyncValue } from "../state/StateHook";

const { createState, createAsyncState, createParameterizedAsyncState } = makeStateFactory();

const baseState = createState(1);

const timesState = createParameterizedAsyncState<number, { times: number}>(async (ctx, variables) => {
    await delay(200);
    return ctx(baseState) * variables.times;
});

const sumState = createAsyncState<number>(async ctx => {
    await delay(200);
    const values = await Promise.all([
        ctx(timesState, {variables: { times: 2}}),
        ctx(timesState, {variables: { times: 3}})
    ]);
    return values[0] + values[1];
});

function delay(millis: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, millis);
    });
}

const InputView: FC = memo(() => {
    
    const baseValue$ = useStateAccessor(baseState);
    
    const onInceaseClick = useCallback(() => {
        baseValue$(baseValue$() + 1);
    }, [baseValue$]);

    return (
        <>
            <div data-testid="base">{baseValue$()}</div>
            <button data-testid="increase" onClick={onInceaseClick}>Increase</button>
        </>
    );
});

const OutputView: FC = memo(() => {
    const { data, loading, error } = useStateAsyncValue(sumState);
    return (
        <>
            { loading && <div data-testid="loading">Loading...</div> }
            { data && <div data-testid="data">{data}</div> }
        </>
    );
});

// Test----------------------------

afterEach(cleanup);

test("Async static", async () => {
    render(
        <StateManagerProvider>
            <InputView/>
            <OutputView/>
        </StateManagerProvider>
    );

    expect((await waitFor(() => screen.getByTestId("loading"), { timeout: 1000 })).textContent).toBe("Loading...");
    expect(screen.queryByTestId("data")).toBeNull();
    
    await waitForElementToBeRemoved(() => screen.queryByTestId("loading"));
    expect((await waitFor(() => screen.getByTestId("data"), { timeout: 1000 })).textContent).toBe("5");

    fireEvent.click(screen.getByTestId("increase"));

    expect((await waitFor(() => screen.getByTestId("loading"), { timeout: 1000 })).textContent).toBe("Loading...");
    expect((await waitFor(() => screen.getByTestId("data"), { timeout: 1000 })).textContent).toBe("5");
    
    await waitForElementToBeRemoved(() => screen.queryByTestId("loading"));
    expect((await waitFor(() => screen.getByTestId("data"), { timeout: 1000 })).textContent).toBe("10");

    fireEvent.click(screen.getByTestId("increase"));

    expect((await waitFor(() => screen.getByTestId("loading"), { timeout: 1000 })).textContent).toBe("Loading...");
    expect((await waitFor(() => screen.getByTestId("data"), { timeout: 1000 })).textContent).toBe("10");
    
    await waitForElementToBeRemoved(() => screen.queryByTestId("loading"));
    expect((await waitFor(() => screen.getByTestId("data"), { timeout: 1000 })).textContent).toBe("15");
});
