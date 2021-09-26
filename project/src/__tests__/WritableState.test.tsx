import { FC, memo, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { cleanup, fireEvent, render } from '@testing-library/react';
import { StateManagerProvider, makeStateFactory, useStateValue, useStateAccessor } from '../';

afterEach(cleanup);

test("WritableState", () => {
    
    const ui = render(<TestedComponent/>);
    
    expect(ui.getByTestId("value").textContent).toBe("0");
    expect(ui.getByTestId("accessor.read").textContent).toBe("0");

    fireEvent.click(ui.getByTestId("accessor.write"));

    expect(ui.getByTestId("value").textContent).toBe("1");
    expect(ui.getByTestId("accessor.read").textContent).toBe("1");
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
    return (
        <div data-testid="value">{count}</div>
    );
});

const SubComponent2: FC = memo(() => {

    const count$ = useStateAccessor(countState);
    const onIncreseClick = useCallback(() => {
        count$(count$() + 1);
    }, [count$]);

    return (
        <>
            <div data-testid="accessor.read">{count$()}</div>
            <button data-testid="accessor.write" onClick={onIncreseClick}>Increse</button>
        </>
    );
});
