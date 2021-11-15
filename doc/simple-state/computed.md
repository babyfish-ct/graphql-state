# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[Simple state](./README.md)/Computed state

## 1. Basic calculation dependency

Let's calculate the average of two numbers

1. Define three states in "State.ts", two writable states, and one computed state
```ts
import { makeStateFactory } from 'graphql-state';

const { createState, createComputedState } = makeStateFactory();

export const firstNumberState = createState("firstNumber", 0);
export const secondNumberState = createState("secondNumber", 0);

export const averageNumberState = createComputedState("averageNumber", ctx => {
    return (ctx(firstNumberState) + ctx(secondNumberState)) / 2;
});
```
"firstNumberState" and "secondNumberState" are two writable states, "averageNumberState" is computed state depends on on them, and calculate their average

Through this piece of code, the calculation dependencies between states are as follows
```
+--------------------+
| averageNumberState |
+----+---------------+
     |
     |      +------------------+
     +----> | firstNumberState |
     |      +------------------+
     |
     |      +-------------------+
     \----> | secondNumberState |
            +-------------------+
```
When any one of "firstNumberState" and "secondNumberState" is changed, "averageNumberState" will automatically recalculate

2. Edit those two writable states in "InputView.tsx"
```ts
import { FC, ChangeEvent, memo, useCallback } from 'react';
import { useStateAccessor } from 'graphql-state';
import { firstNumberState, secondNumberState } from './State';

export const InputView: FC = memo(() => {

    const firstNumber = useStateAccessor(firstNumberState);
    const lastNumber = useStateAccessor(firstNumberState);

    const onFirstNumberChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        firstNumber(e.target.valueAsNumber);
    }, [firstNumber]);
    const onSecondNumberChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        secondNumber(e.target.valueAsNumber);
    }, [secondNumber]);

    return (
        <>
            <div>
                First number: 
                <input type="number" value={firstNumber()} onChange={onFirstNumberChange}/>
            </div>
            <div>
                Second number: 
                <input type="number" value={secondNumber()} onChange={onSecondNumberChange}/>
            </div>
        </>
    );
});
```

3. Present the computed state in "OutputView.tsx"
```ts
import { FC, memo } from 'react';
import { useStateValue } from 'graphql-state';
import { averageNumberState } from './State';

export const OutputView: FC = memo(() => {

    const averageNumber = useStateValue(averageNumberState);
    return <div>The average number is {averageNumber}</div>;    
});
```
> Attention
>
> The computed state is read-only, so only "useStateValue" can be used, "useStateAccessor" cannot be used

4. Integrate all in "App.tsx"
```ts
import { FC, memo } from 'react';
import { StateManagerProvider } from 'graphql-state';
import { InputView } from './InputView';
import { OutputView } from './OutputView';

export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <InputView/>
            <OuputView/>
        </StateManagerProvider>
    );
});
```
When running, we will find that if any one of "firstNumberState" and "secondNumberState" changes, averageNumberState will change.

## 2. Recursive calculation dependency

In the above example, we demonstrated the computed state, but there are three details not demonstrated

- The computed state can not only depend on the writable state, but also on other computed states
- The level of dependency of computed state can be very deep, theoretically it can reach infinite
- The computed state can be parameterized

To this end, let’s use an example of factorial recursive implementation to demonstrate all the above details.

1. Define states in "State.ts"
```ts
import { makeStateFactory } from 'graphql-state';

const { createState, createComputedState } = makeStateFactory();

export const numberState = createState("number", 1);

/* private */ const factorialState = createParameterizedComputedState<number, {
    readonly value: number
}>("factorial", (ctx, variables) => {
    if (variables.value <= 1) {
        return 1;
    }
    return variables.value * ctx.self({
        variables: { value: variables.value - 1 }
    });
});

export const factorialResultState = createComputedState("factorialResult", ctx => {
    return ctx(factorialState, {
        variables: { value: ctx(numberState) }
    });
});
```
> In the above code
> 
>- "ctx(numberState)" means that the current computed state depends on the writable state
>- "ctx(factorialState) indicates that the current computed state depends on another computed state
>- "ctx.self(...)" means that the current parameterized computed state depends on its own sub-state represented by other different parameters

Through this piece of code, the calculation dependencies between states are as follows
```
+----------------------+
| factorialResultState |
+----+-----------------+
     |
     |      +-------------+
     +----> | numberState |
     |      +-------------+
     |
     |      +-----------------------------+
     \----> | factorialState(numberState) |
            +----+------------------------+
                 |
                 |      +---------------------------------+
                 \----> | factorialState(numberState - 1) |
                        +----+----------------------------+
                             |
                             |      +---------------------------------+
                             \----> | factorialState(numberState - 2) |
                                    +----+----------------------------+
                                         |
                                        ...
                                         |      +-------------------+
                                         \----> | factorialState(1) |
                                                +-------------------+
```

If numberState changes, factorialResultState recalculates factorial

2. Edit the writable state "numberState" in "InputView.tsx"
```ts
import { FC, ChangeEvent, memo, useCallback } from 'react';
import { useStateAccessor } from 'graphql-state';
import { numberState } from './State';

export const InputView: FC = memo(() => {

    const number = useStateAccessor(numberState);
    
    const onNumberChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        number(e.target.valueAsNumber);
    }, [number]);

    return (
        <>
            <div>
                Number: 
                <input type="number" value={number()} onChange={onNumberChange}/>
            </div>
        </>
    );
});
```

3. Present the calculation results in OutputView.tsx
```ts
import { FC, memo } from 'react';
import { useStateValue } from 'graphql-state';
import { factorialResultState } from './State';

export const OutputView: FC = memo(() => {

    const factorialResult = useStateValue(factorialResultState);
    return <div>The factorial result is {factorialResult}</div>;    
});
```
> Attention
>
> The computed state is read-only, so only "useStateValue" can be used, "useStateAccessor" cannot be used

4. Integrate all in "App.tsx"
```ts
import { FC, memo } from 'react';
import { StateManagerProvider } from 'graphql-state';
import { InputView } from './InputView';
import { OutputView } from './OutputView';

export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <InputView/>
            <OuputView/>
        </StateManagerProvider>
    );
});
```
After running, we will find that if the "numberState" changes, "factorialResultState" recalculates the factorial

-------------------------

[< Previous: WritableState](./writable.md) | [Back to parent: Simple state](./README.md) | [Next: Async state >](./async.md)

