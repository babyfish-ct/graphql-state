# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/[Simple state](./README.md)/Scopes

Unlike other react state management frameworks, graphql-state not only supports global state, but also any other scope

## Usage

1. Make state support any scope

By default, the state only supports the global scope, and you need to explicitly make it support the other scope
```ts
import { makeStateFactory } from 'graphql-state';
const { createState } = makeStateFactory();

export const countState = createState("anyScopeCount", 0, {
    scope: "any-scope"
});
```

If the scope is not specified here as "any-scope", the default is "global-scope-only"

2. Create new scopes

```ts
import { FC, memo } from 'react';
import { StateManagerProvider, Scope } from 'graphql-state';
import { InputView } from './InputView';
import { OutputView } from './InputView';
export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <Scope name="scope-1">
                <InputView/>
                <OutputView/>
            </Scope>
            <Scope name="scope-2">
                <InputView/>
                <OutputView/>
            </Scope>
        </StateManagerProvider>
    );
});
```
The missing InputView and OutputView are given below. But we see that there are two sets of InputView and OutputView, which belong to two different scopes.

3. InutView and OutptuView

First implement InputView in "InputView.tsx"
```ts
import { FC, memo useCallback } from 'react';
import { useStateAccessor } from 'graphql-state';
import { countState } from './State';

export const InputView: FC = memo(() => {

    const count = useStateAccessor(countState, {
        scope: "local"
    });
    
    const onIncreseClick = useCallback(() => {
        count(count() + 1);
    }, [count]);
    
    return <button>Increase</button>;
}); 
```
> Here, we call useStateAccessor to specify the scope as "local" instead of the default "auto".
>
> This means that the state of the global scope is not used, but the state of the current scope is used.
>
> Note: Only the state created in the "any-scope" mode supports specifying the scope as "local" in useStateAccessor or useStateValue, otherwise it will cause runtime exception. The purpose of this design is to prevent excessive freedom.

Similarly, implement OutputView
```ts
import { FC, memo useCallback } from 'react';
import { useStateValue } from 'graphql-state';
import { countState } from './State';

export const InputView: FC = memo(() => {

    const count = useStateValue(countState, {
        scope: "local"
    });
   
    return <div>count</div>;
}); 
```

4. Running result

After the above code runs
- Inside each scope, InputView and OutputView can use state to communicate information
- The two scopes are isolated from each other, just like two different web sites.

## Nested scope

Scopes can be nested infinitely, such as

```ts
<Scope name="levelOne">
    ...
    <Scope name="levelTwo">
        ...
        <Scope name="levelThree">
            ...
                ...
                    <Scope name="levelN">
                        ...
                    </Scope>
                ...
            ...
        </Scope>
        ...
    </Scope>
    ...
</Scope>
```

---------

[< Previous: Effect](./effect.md) | [Back to parent:Simple state](./README.md)
