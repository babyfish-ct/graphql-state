# [grpahql-state](https://github.com/babyfish-ct/graphql-state)/[Documentation](../README.md)/Simple state

The use of simple state is very similar to recoil, but it can be used in conjunction with graph state.

The framework supports three simple states

1. Writable state
2. Computed state
3. Async state

## 1. Create state API

These functions are used to create states, which are equivalent to variable definitions in programming languages. Their return values should be recorded by global variables so that they can be shared throughout the application.

||No parameters|With parameters|
|---|---|---|
|Writable state|createState|createParameterizedState|
|Computed state|createComputedState|createParameterizedComputedState|
|Async state|createAsyncState|createParameterizedAsycState|

The use of these functions is discussed in detail in the more detailed documentation, here is how to import them, divided into two cases

1. If your application only uses simple states, and does not use graph states
```ts
import { makeStateFactory } from "graphql-state";

const { 
    createState, 
    createComputedState, 
    createAsynState,
    createParameterizedState,
    createParameterizedComputedState,
    createParameterizedAsyncState
} = makeStateFactory();
```

2. If your application uses graph state, after the relevant code is generated, the following code is a better choice
```ts
import { 
    createState, 
    createComputedState, 
    createAsynState,
    createParameterizedState,
    createParameterizedComputedState,
    createParameterizedAsyncState
} from "<The relative path of the root directory of the generated code>";

```

## 2. Use defined state API

There are only two APIs for using state: useStateValue和useStateAccessor

```ts
import { 
    useStateValue, 
    useStateAccessor 
} from 'graphql-state';
```

## 3. Child chapters

1. [Writable state](./writable.md)
2. [Computed state](./computed.md)
3. [Async state](./async.md)
4. [Effect](./effect.md)
5. [Scopes](./scope.md)

---------------------------------------
[Back to parent](../README.md) | [Next: 图状态 >](../graph-state/README.md)
