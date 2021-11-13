# [graphql-state](https://github.com/babyfish-ct/graphql-state)/[文档](../README_zh_CN.md)/[简单状态](./README_zh_CN.md)/可写状态

# 1. 无参数可写状态

1. 新建一个State.ts文件，定义状态
```ts
import { makeStateFactory } from "graphql-state";

const { createState } = makeStateFactory();

export const countState = createState("count", 1);
```
- 第一个参数无实际意义，保证每个状态都有一个唯一的name即可
- 第二个参数表示可写状态的默认值

2. 新建一个OutputView.tsx，显示此状态
```ts
import { FC, memo } from "react";
import { useStateValue } from "graphql-state";
import { countState } from "./State";

export const InputView: FC = memo(() => {

    const count = useStateValue(countState);
    
    return <div>Current count: {count}</div>;
});

```
useStateValue函数用于从状态读取值

3. 新建一个InputView.tsx，修改此状态
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

和返回状态值的useStateValue不同，useStateAccessor返回一个函数。
- 不带参数调用此函数，比如"count()"，表示读取状态的值
- 带参数调用过此函数，比如"count(3)"，表示修改状态的值

例子中的"count(count() + 1)"表示读取状态的旧值，加上1，再设置为状态的新值

4. 在App.tsx中，整合所有

import { FC, memo } from "react";
import { StateManagerProvider } from "graphql-state";
import { OutputView } from "./OutputView";
import { InputView } from "./InputView";

```ts
export const App: FC = memo(() => {
    return (
        <StateManagerProvider>
            <OutputView/>
            <InputView/>
        </StateManagerProvider>
    );
});
```
> 注意
> 使用状态管理的的前提，顶层需要用&lt;StateManagerProvider/&gt;包裹

运行后，可以发现，IuputView对状态的变更，实时地体现在OutputView中，状态完成了跨越组件的信息传递。

# 2. 参数化的可写状态

参数化的状态不在是一个单独的状态, 而是多个状态形成的一个族, 每一个参数都对应到族中一个子状态.

1. 新建一个State.ts文件，定义状态
```ts
import { makeStateFactory } from "graphql-state";

const { createParameterizedState } = makeStateFactory();

export const countState = createParameterizedState<number, {
    readonly parameter: string
}>("count", 1);
```
- 第一个范型参数number，表示所有子状态的类型都是数字。
- 第一个范型参数{ readonly parameter: string; }，表示状态的参数为一个具备parameter字段的对象

> 参数必须是对象类型

2. 新建一个OutputView.tsx，显示特定参数所对应的状态
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

3. 新建一个InputView.tsx，修改特定参数所对应的状态
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

4. 在App.tsx中，整合所有

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
运行后，可以发现，在两个区域内各自有一个状态彼此地工作，看起来就如同使用了两个不同的状态。

虽然参数化的状态看起来很像多个无参数的状态，但是它们还有明显的区别
- 如果定义多个无参数的状态，那么状态的数量必须在编译时刻确定
- 如果使用一个有参数的状态，不必在编译时刻知道子状态的数量，编译时只是定义了未知数量的多个子状态的一个族。运行时的自动决定所需子状态的数量。所传递的参数的取值越多，族内被维护的子状态就越多。

-------------------------------------------------------------
[返回上级：简单状态](./README_zh_CN.md) | [下一篇: 计算状态 >](./computed_zh_CN.md)

