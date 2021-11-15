# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[Simple state](./README.md)/Writable state

# 1. Writable state without parameter

1. Create a new "State.ts" file to define the state
```ts
import { makeStateFactory } from "graphql-state";

const { createState } = makeStateFactory();

export const countState = createState("count", 1);
```
- The first parameter has no practical meaning, just ensure that each state has a unique name
- The second parameter represents the default value of the writable state

2. Create "OutputView.tsx" to display this state
```ts
import { FC, memo } from "react";
import { useStateValue } from "graphql-state";
import { countState } from "./State";

export const InputView: FC = memo(() => {

    const count = useStateValue(countState);
    
    return <div>Current count: {count}</div>;
});

```
The "useStateValue" function is used to read the value from the state

3. Create "InputView.tsx" to change this state
```ts
import { FC, memo, useCallback } from "react";
import { useStateAccessor } from "graphql-state";
import { countState } from "./State";

export const InputView: FC = memo(() => {

    const count = useStateAccessor(countState);
    
    const onIncreaseClick = useCallback(() => {
        count(count() + 1);
    }, [count]);

    return <button>Increase</button>;
});
```

Unlike "useStateValue" which returns value of state, "useStateAccessor" returns a function.
- Call this function without parameters, such as "count()", means reading the value of state
- Called this function with parameters, such as "count(3)", means writing the value of state

The "count(count() + 1)" in the example means reading the old value of the state, adding 1, and then setting result to the state

4. Integrate all in "App.tsx"
```ts
import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { OutputView } from "./OutputView";
import { InputView } from "./InputView";

export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <OutputView/>
            <InputView/>
        </StateManagerProvider>
    );
});
```
> Note
> The premise of using state management is that the top layer needs to be wrapped with &lt;StateManagerProvider/&gt;

After running, it can be found that IuputView's changes to the state are reflected in the OutputView in real time, and the state completes the information transfer across components.

# 2. Parameterized writable state

The parameterized state is no longer a single state, but a family formed by multiple states, and each parameter corresponds to a sub-state in the family.

1. Create "State.ts" to define the state
```ts
import { makeStateFactory } from "graphql-state";

const { createParameterizedState } = makeStateFactory();

export const countState = createParameterizedState<number, {
    readonly parameter: string
}>("count", 1);
```
- The first paradigm parameter: number, indicates that the types of all sub-states are numbers.
- The first paradigm parameter: {readonly parameter: string; }, the parameter representing the state is an object with a "parameter" field

> The parameter must be an object type

2. Create "OutputView.tsx" to display the state corresponding to specific parameters
```ts
import { FC, memo } from "react";
import { useStateValue } from "graphql-state";
import { countState } from "./State";

export const InputView: FC<{
    readonly parameter: string
}> = memo(({parameter}) => {

    const count = useStateValue(countState, {
        variables: { parameter }
    });
    
    return <div>Current count: {count}</div>;
});

```

3. Create "InputView.tsx" to modify the state corresponding to specific parameters
```ts
import { FC, memo, useCallback } from "react";
import { useStateAccessor } from "graphql-state";
import { countState } from "./State";

export const InputView: FC<{
    readonly parameter: string
}> = memo(({parameter}) => {

    const count = useStateAccessor(countState, {
        variables: { parameter }
    });
    
    const onIncreaseClick = useCallback(() => {
        count(count() + 1);
    }, [count]);

    return <button>Increase</button>;
});
```

4. Integrate all in "App.tsx"

import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { OutputView } from "./OutputView";
import { InputView } from "./InputView";

```ts
export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <fieldset>
                <legend>A</legend>
                <OutputView parameter="A"/>
                <InputView parameter="A"/>
            </fieldset>
            <fieldset>
                <legend>B</legend>
                <OutputView parameter="B"/>
                <InputView parameter="B"/>
            </fieldset>
        </StateManagerProvider>
    );
});
```
After running, it can be found that each of the two parameters has a state that works normally, which looks like two different states are used.

Although the parameterized state looks a lot like multiple states without parameters, there are obvious differences between them
- If multiple states without parameters are defined, the number of states must be determined at compile time
- If you use a state with parameters, you don't need to know the number of sub-states at compile time. Only a family of multiple sub-states with an unknown number is defined at compile time. The number of required sub-states is automatically determined at runtime. The more values of the parameters passed, the more sub-states are maintained in the family.

-------------------------------------------------------------
[Back to parent: Simple state](./README.md) | [Next: Computed state >](./computed.md)

