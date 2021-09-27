import { FC, memo, useCallback } from "react";
import { cleanup, fireEvent, render } from '@testing-library/react';
import { StateManagerProvider, makeStateFactory, useStateValue, useStateAccessor } from '..';

afterEach(cleanup);

const { createState, createComputedState, createParameterizedComputedState } = makeStateFactory();

const baseState = createState(1);

const timesState = createParameterizedComputedState<number, { times: number }>((ctx, variables) => {
    const times = variables.times ?? 1;
    return ctx(baseState) * times;
});

const sumState = createComputedState(ctx => {
    return (
        ctx(baseState) +
        ctx(timesState, { variables: { times: 2} }) +
        ctx(timesState, { variables: { times: 3} }) 
    );
});

const factorialState = createParameterizedComputedState<number, { value: number}>((ctx, variables) => {
    const { value } = variables;
    if (value <= 1) {
        return 1;
    }
    return value * ctx.self({
        variables: { value: value - 1}
    });
});

const finalFactorialState = createComputedState<number>(ctx => {
    return ctx(factorialState, {
        variables: { value: ctx(sumState) }
    });
});


test("Simple Computed state", () => {

    const ui = render(
        <StateManagerProvider>
            <InputView/>
            <OutputView_Depth1/>
            <OutputView_Depth2/>
            <OutputView_Factorial/>
        </StateManagerProvider>
    );

    expect(ui.getByTestId("base").textContent).toBe("1");
    expect(ui.getByTestId("double").textContent).toBe("2");
    expect(ui.getByTestId("triple").textContent).toBe("3");
    expect(ui.getByTestId("sum").textContent).toBe("6");
    expect(ui.getByTestId("factorial").textContent).toBe(`${factorial(6)}`);

    fireEvent.click(ui.getByTestId("increase"));

    expect(ui.getByTestId("base").textContent).toBe("2");
    expect(ui.getByTestId("double").textContent).toBe("4");
    expect(ui.getByTestId("triple").textContent).toBe("6");
    expect(ui.getByTestId("sum").textContent).toBe("12");
    expect(ui.getByTestId("factorial").textContent).toBe(`${factorial(12)}`);

    fireEvent.click(ui.getByTestId("increase"));

    expect(ui.getByTestId("base").textContent).toBe("3");
    expect(ui.getByTestId("double").textContent).toBe("6");
    expect(ui.getByTestId("triple").textContent).toBe("9");
    expect(ui.getByTestId("sum").textContent).toBe("18");
    expect(ui.getByTestId("factorial").textContent).toBe(`${factorial(18)}`);
});

const InputView: FC = memo(() => {

    const baseValue$ = useStateAccessor(baseState);
    const onIncreaseClick = useCallback(() => {
        baseValue$(baseValue$() + 1);
    }, [baseValue$]);

    return (
        <>
            <button data-testid="increase" onClick={onIncreaseClick}>Increse</button>
        </>
    );
});

const OutputView_Depth1: FC = memo(() => {

    const baseValue = useStateValue(baseState);
    const doubleValue = useStateValue(timesState, {
        variables: { times: 2}
    });
    const tripleValue = useStateValue(timesState, {
        variables: { times: 3 }
    });

    return (
        <>
            <div data-testid="base">{baseValue}</div>
            <div data-testid="double">{doubleValue}</div>
            <div data-testid="triple">{tripleValue}</div>
        </>
    );
});

const OutputView_Depth2: FC = memo(() => {

    const sumValue = useStateValue(sumState);

    return (
        <>
            <div data-testid="sum">{sumValue}</div>
        </>
    );
});

const OutputView_Factorial: FC = memo(() => {

    const factorialValue = useStateValue(finalFactorialState);

    return (
        <>
            <div data-testid="factorial">{factorialValue}</div>
        </>
    );
});

function factorial(value: number) {
    let result = 1;
    for (let i = 1; i <= value; i++) {
        result *= i;
    }
    return result;
}