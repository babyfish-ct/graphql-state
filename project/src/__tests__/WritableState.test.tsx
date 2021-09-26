import { FC, memo, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { cleanup, fireEvent, render } from '@testing-library/react';
import { StateManagerProvider, makeStateFactory, useStateValue, useStateAccessor } from '../';

afterEach(cleanup);

test("WritableState", () => {
    
    const ui = render(<TestedComponent/>);
    
    expect(ui.getByTestId("value").textContent).toBe("0");
    expect(ui.getByTestId("accessor.read").textContent).toBe("0");
    expect(ui.getByTestId("valueA").textContent).toBe("0");
    expect(ui.getByTestId("accessorA.read").textContent).toBe("0");
    expect(ui.getByTestId("valueB").textContent).toBe("0");
    expect(ui.getByTestId("accessorB.read").textContent).toBe("0");

    fireEvent.click(ui.getByTestId("accessor.write"));

    expect(ui.getByTestId("value").textContent).toBe("1");
    expect(ui.getByTestId("accessor.read").textContent).toBe("1");
    expect(ui.getByTestId("valueA").textContent).toBe("0");
    expect(ui.getByTestId("accessorA.read").textContent).toBe("0");
    expect(ui.getByTestId("valueB").textContent).toBe("0");
    expect(ui.getByTestId("accessorB.read").textContent).toBe("0");

    fireEvent.click(ui.getByTestId("accessorA.write"));

    expect(ui.getByTestId("value").textContent).toBe("1");
    expect(ui.getByTestId("accessor.read").textContent).toBe("1");
    expect(ui.getByTestId("valueA").textContent).toBe("1");
    expect(ui.getByTestId("accessorA.read").textContent).toBe("1");
    expect(ui.getByTestId("valueB").textContent).toBe("0");
    expect(ui.getByTestId("accessorB.read").textContent).toBe("0");

    fireEvent.click(ui.getByTestId("accessorB.write"));

    expect(ui.getByTestId("value").textContent).toBe("1");
    expect(ui.getByTestId("accessor.read").textContent).toBe("1");
    expect(ui.getByTestId("valueA").textContent).toBe("1");
    expect(ui.getByTestId("accessorA.read").textContent).toBe("1");
    expect(ui.getByTestId("valueB").textContent).toBe("1");
    expect(ui.getByTestId("accessorB.read").textContent).toBe("1");
});

const { createState } = makeStateFactory();

const countState = createState(0);

const TestedComponent: FC = memo(() => {
    return (
        <StateManagerProvider>
            <SubComponent1/>
            <SubComponent2/>         
        </StateManagerProvider>
    );
});

const SubComponent1: FC = memo(() => {
    const count = useStateValue(countState);
    const countA = useStateValue(countState, {
        variables: { type: "A" }
    });
    const countB = useStateValue(countState, {
        variables: { type: "B" }
    });
    return (
        <>
            <div data-testid="value">{count}</div>
            <div data-testid="valueA">{countA}</div>
            <div data-testid="valueB">{countB}</div>
        </>
    );
});

const SubComponent2: FC = memo(() => {

    const count$ = useStateAccessor(countState, {
        variables: {} // empty variables === no variables
    });
    const countA$ = useStateAccessor(countState, {
        variables: { type: "A" }
    });
    const countB$ = useStateAccessor(countState, {
        variables: { type: "B" }
    });

    const onIncreseClick = useCallback(() => {
        count$(count$() + 1);
    }, [count$]);

    const onIncreseAClick = useCallback(() => {
        countA$(countA$() + 1);
    }, [countA$]);

    const onIncreseBClick = useCallback(() => {
        countB$(countB$() + 1);
    }, [countB$]);

    return (
        <>
            <div>
                <div data-testid="accessor.read">{count$()}</div>
                <button data-testid="accessor.write" onClick={onIncreseClick}>Increse</button>
            </div>
            <div>
                <div data-testid="accessorA.read">{countA$()}</div>
                <button data-testid="accessorA.write" onClick={onIncreseAClick}>Increse</button>
            </div>
            <div>
                <div data-testid="accessorB.read">{countB$()}</div>
                <button data-testid="accessorB.write" onClick={onIncreseBClick}>Increse</button>
            </div>
        </>
    );
});
