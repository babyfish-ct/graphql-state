# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[Simple state](./README.md)/Async state

Asynchronous state is a kind of computed state. Compared with computed state, the only difference is that its calculation function is asynchronous.

In view of this, this chapter will not explain the calculation dependency and parameterization of the asynchronous state, but will focus on the reception of asynchronous result.

First, define the asynchronous state in "State.ts"

```ts
import { makeStateFactory } from 'graphql-state';

const { createAsyncState } = makeStateFactory();

export const delayedState = createAsyncState("delayed-state", async ctx => {
    await delay(3000);
    return "Hello world";
});

function delay(millis: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => { resolve() }, millis);
    })
}
```
When using the "useStateValue" function to get a value from an asynchronous state, you can set the "asyncStyle" parameter, which has three choices
1. suspense
2. suspense-refetch
3. async-object

**With the different asyncStyle parameters, the return type of the useStateValue function is also different**

## 1. suspense
This is the default mode. This mode is used even if "asyncStyle" is not specified when calling "useStateValue".

Use the "useStateValue" function in "suspense" mode in "DelayedView.tsx"
```ts
import { FC, memo } from 'react';
import { useStateValue } from 'graphql-state';
import { delayedState } from './State';

export const DelayedView: FC = memo(() => {
    const delayed = useStateValue(delayedState, {
        // External component must use <Suspense/> to wrap the current component
        asyncStyle: "suspense" 
    });
    return <div>The delayed value is {delayed}</div>;
});
```
For the "suspense" mode, the return value of "useStateValue" is the asynchronous result, which seems to be the same as a non-asynchronous state. But you need to use &lt;Suspense/&gt; for more peripheral components, otherwise it will cause runtime exception.

The implementation of "App.tsx" should be as follows
```
import { FC, memo, Suspense } from 'react';
import { StateManagerProvider } from 'graphql-state';
import { DelayedView } from './DelayedView';

export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <Suspense fallback={<div>Loading...</div>}>
                <DelayedView/>
            </Suspense>
        </StateManagerProvider>
    );
});
```

## 2. suspense-refetch

Similar to the "suspense" mode, external components are also required to use &lt;Suspense/&gt;, but the return type of "useStateValue" is different from "suspense". 

Assuming that the data type of the asynchronous state is T, the return type of the "useStateValue" function in this mode is as follows
```ts
{
    readonly data: T;
    readonly refetch: () => void
}
```

Use the "useStateValue" function in "suspense-refetch" mode in "DelayedView.tsx"
```ts
import { FC, memo } from 'react';
import { useStateValue } from 'graphql-state';
import { delayedState } from './State';

export const DelayedView: FC = memo(() => {
    const { data: delayed, refetch}  = useStateValue(delayedState, {
        // External component must use <Suspense/> to wrap the current component
        asyncStyle: "suspense-refetch"
    });
    return (
        <>
            <div>The delayed value is {delayed}</div>
            <button onClick={refetch}>Recompute async state</button>
        </>
    );
});
```
Similar to the "suspense" mode, the peripheral components use &lt;Suspense/&gt;, otherwise it will cause runtime exception. This has been demonstrated above, for the sake of brevity, the corresponding code will not be repeated here

## 3. async-object

Unlike the previous two modes, external components no longer need to use &lt;Suspense/&gt;, and the user controls the asynchronous state. 

Assuming that the data type of the asynchronous state is T, the return type of the useStateValue function in this mode is as follows
```ts
{
    readonly data？: T;
    readonly loading: boolean;
    readonly error: any;
    readonly refetch: () => void
}
```
> Note
>
> Unlike the "data" field of the object returned by "useStateValue" in the "suspense-refetch" mode, the "data" field here is marked by "?", which is a field that can be undefined. When "loading" is true or "error" exists, "data" must be undefined.

Use the "useStateValue" function in "async-object" mode in DelayedView.tsx
```ts
import { FC, memo } from 'react';
import { useStateValue } from 'graphql-state';
import { delayedState } from './State';

export const DelayedView: FC = memo(() => {
    const { data: delayed, loading, refetch}  = useStateValue(delayedState, {
        asyncStyle: "async-object"
    });
    return (
        <>
            {loading && <div>Loading...</div>}
            {
                delayed && <>
                    <div>The delayed value is {delayed}</div>
                    <button onClick={refetch}>Recompute async state</button>
                </>
            }
        </>
    );
});
```

The async-object mode no longer requires peripheral components to use &lt;Suspense/&gt;
```
import { FC, memo } from 'react';
import { StateManagerProvider } from 'graphql-state';
import { DelayedView } from './DelayedView';

export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <DelayedView/>
        </StateManagerProvider>
    );
});
```

[< Previous: Computed state](./computed.md) | [Back to parent: Simple state](./README.md) | [Next: Effect >](./effect.md)
