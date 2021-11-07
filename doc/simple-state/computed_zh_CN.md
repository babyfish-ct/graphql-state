# [graphql-state](/)/[文档](../README_zh_CN.md)/[简单状态](./README_zh_CN.md)/计算状态

##1. 简单计算依赖

我们来计算两个数的平均数

1. 在State.ts中定义三个状态，两个可写状态，一个计算字段
```ts
import { makeStateFactory } from 'graphql-state';

const { createState, createComputedState } = makeStateFactory();

export const firstNumberState = createState("firstNumber", 0);
export const secondNumberState = createState("secondNumber", 0);

export const averageNumberState = createComputedState("averageNumber", ctx => {
    return (ctx(firstNumberState) + ctx(secondNumberState)) / 2;
});
```
firstNumberState和secondNumberState是两个可写状态，averageNumberState是依赖它们的一个计算状态，计算它们的平均值

通过这这样一段代码，状态之间的计算依赖如下
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
当firstNumberState和secondNumberState中任何一个变化时，averageNumberState就会自动重新计算

2. 在InputView.tsx中编辑两个可写状态
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

3. 在OutputView.tsx呈现计算状态
```ts
import { FC, memo } from 'react';
import { useStateValue } from 'graphql-state';
import { averageNumberState } from './State';

export const OutputView: FC = memo(() => {

    const averageNumber = useStateValue(averageNumberState);
    return <div>The average number is {averageNumber}</div>;    
});
```
> 注意
> 
> 计算状态是只读的，所以只能使用useStateValue，不能对其使用useStateAcessor

4. 在App.tsx中整合它们
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
运行起来，我们会发现，firstNumberState和secondNumberState中任何一个变更，averageNumberState机会变更

## 2. 递归计算依赖

在上面的例子中过，我们演示了计算属性，但是有三个细节并未演示

- 计算状态不仅可以依赖于可写状态，也可以依赖于其它计算状态
- 计算状态的依赖的层次可以很深，理论上可以达到无限
- 计算状态可以被参数化

为此，接下来我们用一个阶乘递归实现的例子演示上述所有细节

1. 在State.ts中定义状态
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
> 上面的代码中
> - "ctx(numberState)"表示当前计算状态依赖于可写状态
> - "ctx(factorialState)表示当前计算状态依赖于另外一个计算状态"
> - "ctx.self(...)"表示当前参数化计算状态依赖于其自身的另外不同参数所代表一个子状态

通过这这样一段代码，状态之间的计算依赖如下
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

如果numberState发生变化，factorialResultState重新计算阶乘

2. 在InputView.tsx中编辑可写状态numberState
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

3. 在OutputView.tsx呈现计算状态
```ts
import { FC, memo } from 'react';
import { useStateValue } from 'graphql-state';
import { factorialResultState } from './State';

export const OutputView: FC = memo(() => {

    const factorialResult = useStateValue(factorialResultState);
    return <div>The factorial result is {factorialResult}</div>;    
});
```
> 注意
> 
> 计算状态是只读的，所以只能使用useStateValue，不能对其使用useStateAcessor

4. 在App.tsx中整合它们
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
运行起来，我们会发现，如果numberState发生变化，factorialResultState重新计算阶乘

-------------------------

[< 上一篇：可写状态](./writable_zh_CN.md) | [返回上级：简单状态](./README_zh_CN.md) | [下一篇：异步状态 >](./async_zh_CN.md)

